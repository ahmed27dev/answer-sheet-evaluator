from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List
from datetime import datetime
from bson import ObjectId
import shutil, os, re, tempfile

from models import EvaluateResponse
from ocr_module.ocr_module import extract_text_from_image, extract_text_from_string
from nlp_module.nlp_mock import evaluate_answer
from services.ollama_service import generate_feedback
from database import db, evaluations_collection

router = APIRouter(
    prefix="/evaluate",
    tags=["Evaluation"]
)


async def fetch_question_by_id(question_id: str) -> dict:
    try:
        q = await db["questions"].find_one({"_id": ObjectId(question_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid question_id.")
    if not q:
        raise HTTPException(status_code=404, detail="Question not found.")
    return q


async def fetch_question_by_number(number: int):
    return await db["questions"].find_one({"question_number": number})


def split_ocr_by_question(text: str) -> dict:
    pattern = r'(?:Q(?:uestion)?\s*(?:No\.?)?\s*(\d+)[.)\s:]?)'
    parts = re.split(pattern, text)

    result = {}

    i = 1
    while i < len(parts) - 1:
        try:
            q_num = int(parts[i])
            answer_text = parts[i + 1].strip()
            if answer_text:
                result[q_num] = answer_text
        except:
            pass
        i += 2

    return result


async def evaluate_single(q_doc: dict, student_answer: str, feedback_mode: str):
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


@router.post("/batch")
async def evaluate_batch(
    files: List[UploadFile] = File(...),
    feedback_mode: str = Form("ollama")
):
    allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"]

    full_text = ""

    for file in files:
        if file.content_type not in allowed:
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Allowed: jpg, png, webp."
            )

        temp_path = os.path.join(tempfile.gettempdir(), file.filename)

        with open(temp_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        try:
            ocr_result = extract_text_from_image(temp_path)
            page_text = ocr_result.get("text", "").strip()

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

    for q_num, student_answer in sorted(split_answers.items()):
        q_doc = await fetch_question_by_number(q_num)

        if not q_doc:
            not_found.append(q_num)
            continue

        result = await evaluate_single(q_doc, student_answer, feedback_mode)

        results.append(result)
        total_marks += result["marks"]
        total_max += result["max_marks"]

    await evaluations_collection.insert_one({
        "type": "batch",
        "filenames": [file.filename for file in files],
        "ocr_text": full_text,
        "results": results,
        "total_marks": total_marks,
        "total_max": total_max,
        "not_found": not_found,
        "created_at": datetime.utcnow()
    })

    return {
        "total_marks": total_marks,
        "total_max": total_max,
        "results": results,
        "not_found": not_found
    }

@router.post("/preview")
async def preview_ocr(
    files: List[UploadFile] = File(...)
):
    full_text = ""

    for file in files:
        temp_path = os.path.join(tempfile.gettempdir(), file.filename)

        with open(temp_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        try:
            ocr_result = extract_text_from_image(temp_path)
            page_text = ocr_result.get("text", "").strip()

            if page_text:
                full_text += "\n" + page_text

        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    if not full_text:
        raise HTTPException(status_code=422, detail="OCR returned empty text.")

    return {"text": full_text}



@router.get("/health")
def health_check():
    return {"status": "Evaluate router is running ✅"}


@router.get("/history")
async def get_history():
    results = []

    async for doc in evaluations_collection.find().sort("created_at", -1).limit(20):
        doc["_id"] = str(doc["_id"])
        results.append(doc)

    return {"evaluations": results}