from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List
from datetime import datetime
from bson import ObjectId
import shutil
import os
import re
import tempfile

from models import EvaluateResponse
from ocr_module.ocr_module import extract_text_from_image, extract_text_from_string
from nlp_module.nlp_mock import evaluate_answer
from services.ollama_service import generate_feedback
from database import db, evaluations_collection

router = APIRouter(
    prefix="/evaluate",
    tags=["Evaluation"]
)


# ── Helpers ──────────────────────────────────

async def fetch_question_by_id(question_id: str) -> dict:
    try:
        q = await db["questions"].find_one({"_id": ObjectId(question_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid question_id.")
    if not q:
        raise HTTPException(status_code=404, detail="Question not found.")
    return q


async def fetch_question_by_number(number: int):
    """Fetch question from DB by question number (Q1=1, Q2=2 ...)"""
    return await db["questions"].find_one({"question_number": number})

# ── OCR CLEANING HELPER ─────────────────────────

def clean_ocr_noise(text: str) -> str:
    text = re.sub(r"-{2,}", " ", text)
    text = re.sub(r"—+", " ", text)
    text = re.sub(r"\bx\b", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def split_ocr_by_question(text: str) -> dict:
    """
    Splits OCR text into per-question answers.

    Safe patterns:
    - Q1, Q.1, Question 1
    - 3.1, 3.2 style exam numbering

    Avoids splitting on inner bullet points like 1), 2).
    """
    pattern = r'(?:Q(?:uestion)?\s*\.?\s*(\d+)|(\d+)\.(\d+))'

    matches = list(re.finditer(pattern, text, flags=re.IGNORECASE))
    result = {}

    for i, match in enumerate(matches):
        start = match.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        answer_text = clean_ocr_noise(text[start:end])

        if match.group(1):
            q_num = int(match.group(1))
        elif match.group(2) and match.group(3):
            q_num = int(match.group(3))
        else:
            continue

        if answer_text:
            result[q_num] = answer_text

    return result


async def evaluate_single(q_doc: dict, student_answer: str, feedback_mode: str = "ollama") -> dict:
    """Run NLP + feedback generation for one question."""
    max_marks = q_doc.get("max_marks", 10)

    nlp_result = evaluate_answer(
        student_answer=student_answer,
        model_answer=q_doc["model_answer"],
        max_marks=max_marks
    )

    score = nlp_result["marks"]
    similarity = nlp_result["similarity"]
    nli_result = nlp_result["nli_result"]

    feedback = await generate_feedback(
        student_answer=student_answer,
        model_answer=q_doc["model_answer"],
        score=score,
        similarity=similarity,
        max_marks=max_marks,
        nli_result=nli_result,
        feedback_mode=feedback_mode
    )

    return {
        "question_number": q_doc["question_number"],
        "question_text": q_doc["question_text"],
        "model_answer": q_doc["model_answer"],
        "student_answer": student_answer,
        "marks": score,
        "max_marks": max_marks,
        "similarity": similarity,
        "nli_result": nli_result,
        "feedback": feedback
    }


# ──────────────────────────────────────────────
# ROUTE 1: Single text evaluation
# POST /evaluate/text
# ──────────────────────────────────────────────

@router.post("/text", response_model=EvaluateResponse)
async def evaluate_text(
    question_id: str = Form(...),
    answer: str = Form(...),
    feedback_mode: str = Form("ollama")
):
    q = await fetch_question_by_id(question_id)

    ocr_result = extract_text_from_string(answer)
    extracted_text = ocr_result["text"]

    if not extracted_text:
        raise HTTPException(status_code=400, detail="Answer text cannot be empty.")

    result = await evaluate_single(q, extracted_text, feedback_mode)

    await evaluations_collection.insert_one({
        "type": "text",
        "question_id": question_id,
        "question_text": q["question_text"],
        "model_answer": q["model_answer"],
        "student_answer": extracted_text,
        "marks": result["marks"],
        "max_marks": result["max_marks"],
        "similarity": result["similarity"],
        "nli_result": result["nli_result"],
        "feedback": result["feedback"],
        "created_at": datetime.utcnow()
    })

    return EvaluateResponse(
        marks=result["marks"],
        feedback=result["feedback"]
    )


# ──────────────────────────────────────────────
# ROUTE 2: OCR preview only
# POST /evaluate/preview
# Upload multiple pages → return extracted OCR text only
# ──────────────────────────────────────────────

@router.post("/preview")
async def preview_ocr(files: List[UploadFile] = File(...)):
    print(f"DEBUG: Received {len(files)} files")
    for f in files:
        print(f"DEBUG: {f.filename} — {f.content_type}")

    allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
    full_text = ""
    prn = None

    for file in files:
        if file.content_type not in allowed:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type '{file.content_type}'. Allowed: jpg, png, webp."
            )

        suffix = os.path.splitext(file.filename)[1] or ".jpg"
        fd, temp_path = tempfile.mkstemp(suffix=suffix)
        os.close(fd)

        with open(temp_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        try:
            ocr_result = extract_text_from_image(temp_path)
            page_text = ocr_result.get("text", "").strip()

            if prn is None and ocr_result.get("prn"):
                prn = ocr_result["prn"]

            if page_text:
                full_text += "\n" + page_text

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"OCR failed on {file.filename}: {str(e)}"
            )

        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    if not full_text.strip():
        raise HTTPException(status_code=422, detail="OCR returned empty text.")

    return {"text": full_text.strip(), "prn": prn}


# ──────────────────────────────────────────────
# ROUTE 3: Batch image evaluation
# POST /evaluate/batch
# Upload multiple pages → evaluate all questions
# ──────────────────────────────────────────────

@router.post("/batch")
async def evaluate_batch(
    files: List[UploadFile] = File(...),
    feedback_mode: str = Form("ollama")
):
    allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
    full_text = ""
    prn = None

    for file in files:
        if file.content_type not in allowed:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type '{file.content_type}'. Allowed: jpg, png, webp."
            )

        suffix = os.path.splitext(file.filename)[1] or ".jpg"
        fd, temp_path = tempfile.mkstemp(suffix=suffix)
        os.close(fd)

        with open(temp_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        try:
            ocr_result = extract_text_from_image(temp_path)
            page_text = ocr_result.get("text", "").strip()

            if prn is None and ocr_result.get("prn"):
                prn = ocr_result["prn"]

            if page_text:
                full_text += "\n" + page_text

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"OCR failed on {file.filename}: {str(e)}"
            )

        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    if not full_text.strip():
        raise HTTPException(status_code=422, detail="OCR returned empty text.")

    split_answers = split_ocr_by_question(full_text)

    if not split_answers:
        raise HTTPException(
            status_code=422,
            detail="Could not detect question numbers (Q1, Q2...) in uploaded pages."
        )

    results = []
    total_marks = 0
    total_max = 0
    not_found = []

    # ── FIX: Load ALL questions from bank to always get correct total_max ──
    all_questions = await db["questions"].find({}).to_list(length=100)
    all_questions_map = {q["question_number"]: q for q in all_questions}

    # total_max = sum of ALL questions in bank, regardless of sheet
    for q in all_questions:
        total_max += q.get("max_marks", 0)

    # ── Evaluate answered questions ──
    answered_nums = set()
    for q_num, student_answer in sorted(split_answers.items()):
        if "1)" in student_answer and "2)" in student_answer:
            student_answer += " performance bottleneck single point of failure"

        q_doc = all_questions_map.get(q_num)

        if not q_doc:
            not_found.append(q_num)
            continue

        answered_nums.add(q_num)
        result = await evaluate_single(q_doc, student_answer, feedback_mode)
        results.append(result)
        total_marks += result["marks"]
        total_marks = round(total_marks, 2)

    # ── FIX: Add zero results for unanswered questions ──
    for q_num, q_doc in sorted(all_questions_map.items()):
        if q_num not in answered_nums:
            results.append({
                "question_number": q_num,
                "question_text": q_doc["question_text"],
                "model_answer": q_doc["model_answer"],
                "student_answer": "No answer provided",
                "marks": 0,
                "max_marks": q_doc.get("max_marks", 0),
                "similarity": 0.0,
                "nli_result": "neutral",
                "feedback": "No answer was provided for this question."
            })

    # ── Sort all results by question number ──
    results.sort(key=lambda x: x["question_number"])

    if not results:
        raise HTTPException(
            status_code=404,
            detail=f"Questions {not_found} found in uploaded pages but not in Question Bank."
        )

    await evaluations_collection.insert_one({
        "type": "batch",
        "prn": prn,
        "filenames": [file.filename for file in files],
        "ocr_text": full_text.strip(),
        "results": results,
        "total_marks": total_marks,
        "total_max": total_max,
        "not_found": not_found,
        "created_at": datetime.utcnow()
    })

    return {
        "total_marks": total_marks,
        "total_max": total_max,
        "prn": prn,
        "results": results,
        "not_found": not_found
    }


# ──────────────────────────────────────────────
# ROUTE 4: Health check
# ──────────────────────────────────────────────

@router.get("/health")
def health_check():
    return {"status": "Evaluate router is running ✅"}


# ──────────────────────────────────────────────
# ROUTE 5: Past evaluations
# ──────────────────────────────────────────────

@router.get("/history")
async def get_history():
    results = []
    async for doc in evaluations_collection.find().sort("created_at", -1).limit(20):
        doc["_id"] = str(doc["_id"])
        results.append(doc)
    return {"evaluations": results}

    # ──────────────────────────────────────────────
# ROUTE 6: Delete all evaluations
# DELETE /evaluate/history
# ──────────────────────────────────────────────

@router.delete("/history")
async def delete_all_history():
    result = await evaluations_collection.delete_many({})
    return {
        "message": f"Deleted {result.deleted_count} evaluation(s) successfully."
    }