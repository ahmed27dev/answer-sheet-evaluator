
# from fastapi import APIRouter, UploadFile, File, Form, HTTPException
# from datetime import datetime
# from bson import ObjectId
# import shutil, os

# from models import EvaluateResponse
# from ocr_module.ocr_module import extract_text_from_image, extract_text_from_string
# from nlp_module.nlp_mock import evaluate_answer
# from services.ollama_service import generate_feedback
# from database import db, evaluations_collection

# router = APIRouter(
#     prefix="/evaluate",
#     tags=["Evaluation"]
# )


# # ── Helper: fetch question from DB ───────────

# async def fetch_question(question_id: str) -> dict:
#     try:
#         q = await db["questions"].find_one({"_id": ObjectId(question_id)})
#     except Exception:
#         raise HTTPException(status_code=400, detail="Invalid question_id format.")
#     if not q:
#         raise HTTPException(
#             status_code=404,
#             detail="Question not found. Add it first via POST /questions/"
#         )
#     return q


# # ── Helper: performance hint ─────────────────

# def get_hint(score: int, max_marks: int) -> str:
#     pct = (score / max_marks) * 100 if max_marks > 0 else 0
#     if pct >= 85:   return "excellent"
#     elif pct >= 65: return "good"
#     elif pct >= 45: return "partial"
#     else:           return "poor"


# # ──────────────────────────────────────────────
# # ROUTE 1: Evaluate from plain text input
# # POST /evaluate/text
# # ──────────────────────────────────────────────

# @router.post("/text", response_model=EvaluateResponse)
# async def evaluate_text(
#     question_id: str = Form(...),
#     answer:      str = Form(...)
# ):
#     # ── Fetch question + model answer from DB ──
#     q            = await fetch_question(question_id)
#     model_answer = q["model_answer"]
#     max_marks    = q.get("max_marks", 10)

#     # ── Step 1: Clean text ──
#     ocr_result     = extract_text_from_string(answer)
#     extracted_text = ocr_result["text"]

#     if not extracted_text:
#         raise HTTPException(status_code=400, detail="Answer text cannot be empty.")

#     # ── Step 2: NLP scoring (student vs model answer) ──
#     nlp_result = evaluate_answer(
#         student_answer=extracted_text,
#         model_answer=model_answer        # ← FIXED: real model answer
#     )
#     score      = nlp_result["marks"]
#     similarity = nlp_result["similarity"]
#     nli_result = nlp_result["nli_result"]

#     # ── Step 3: Ollama local feedback ──
#     feedback = await generate_feedback(
#         student_answer=extracted_text,
#         model_answer=model_answer,
#         score=score,
#         similarity=similarity,
#         max_marks=max_marks,
#         nli_result=nli_result
#     )

#     # ── Step 4: Save to MongoDB ──
#     await evaluations_collection.insert_one({
#         "type":           "text",
#         "question_id":    question_id,
#         "question_text":  q["question_text"],
#         "student_answer": extracted_text,
#         "marks":          score,
#         "max_marks":      max_marks,
#         "similarity":     similarity,
#         "nli_result":     nli_result,
#         "feedback":       feedback,
#         "created_at":     datetime.utcnow()
#     })

#     return EvaluateResponse(marks=score, feedback=feedback)


# # ──────────────────────────────────────────────
# # ROUTE 2: Evaluate from image upload
# # POST /evaluate/image
# # ──────────────────────────────────────────────

# @router.post("/image", response_model=EvaluateResponse)
# async def evaluate_image(
#     question_id: str        = Form(...),
#     file:        UploadFile = File(...)
# ):
#     allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
#     if file.content_type not in allowed:
#         raise HTTPException(
#             status_code=400,
#             detail=f"Invalid file type '{file.content_type}'. Allowed: jpg, png, webp."
#         )

#     # ── Fetch question + model answer from DB ──
#     q            = await fetch_question(question_id)
#     model_answer = q["model_answer"]
#     max_marks    = q.get("max_marks", 10)

#     # ── Step 1: Save image temporarily + OCR ──
#     temp_path = f"/tmp/{file.filename}"
#     with open(temp_path, "wb") as f:
#         shutil.copyfileobj(file.file, f)

#     try:
#         ocr_result     = extract_text_from_image(temp_path)
#         extracted_text = ocr_result["text"]
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"OCR failed: {str(e)}")
#     finally:
#         if os.path.exists(temp_path):
#             os.remove(temp_path)

#     if not extracted_text:
#         raise HTTPException(status_code=422, detail="OCR returned empty text. Check image quality.")

#     # ── Step 2: NLP scoring (student vs model answer) ──
#     nlp_result = evaluate_answer(
#         student_answer=extracted_text,
#         model_answer=model_answer        # ← FIXED: real model answer
#     )
#     score      = nlp_result["marks"]
#     similarity = nlp_result["similarity"]
#     nli_result = nlp_result["nli_result"]

#     # ── Step 3: Ollama local feedback ──
#     feedback = await generate_feedback(
#         student_answer=extracted_text,
#         model_answer=model_answer,
#         score=score,
#         similarity=similarity,
#         max_marks=max_marks,
#         nli_result=nli_result
#     )

#     # ── Step 4: Save to MongoDB ──
#     await evaluations_collection.insert_one({
#         "type":           "image",
#         "filename":       file.filename,
#         "question_id":    question_id,
#         "question_text":  q["question_text"],
#         "student_answer": extracted_text,
#         "marks":          score,
#         "max_marks":      max_marks,
#         "similarity":     similarity,
#         "nli_result":     nli_result,
#         "feedback":       feedback,
#         "created_at":     datetime.utcnow()
#     })

#     return EvaluateResponse(marks=score, feedback=feedback)


# # ──────────────────────────────────────────────
# # ROUTE 3: Health check
# # ──────────────────────────────────────────────

# @router.get("/health")
# def health_check():
#     return {"status": "Evaluate router is running ✅"}


# # ──────────────────────────────────────────────
# # ROUTE 4: Past evaluations
# # ──────────────────────────────────────────────

# @router.get("/history")
# async def get_history():
#     results = []
#     async for doc in evaluations_collection.find().sort("created_at", -1).limit(20):
#         doc["_id"] = str(doc["_id"])
#         results.append(doc)
#     return {"evaluations": results}

# ──────────────────────────────────────────────
# Evaluate Router
# Routes: text eval, image eval, batch image eval
# ──────────────────────────────────────────────

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
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


def split_ocr_by_question(text: str) -> dict:
    """
    Splits OCR text into per-question answers.
    Handles: Q1, Q2, q1, q2, Q1., Q1:, Question 1, Ans 1 etc.

    Returns: { 1: "answer text", 2: "answer text", ... }
    """
    pattern = r'(?:Q|q|Question|question|Ans|ans|Answer|answer)\s*(\d+)[.:\s]'

    parts = re.split(pattern, text)

    result = {}

    i = 1
    while i < len(parts) - 1:
        try:
            q_num = int(parts[i])
            answer_text = parts[i + 1].strip()
            if answer_text:
                result[q_num] = answer_text
        except (ValueError, IndexError):
            pass
        i += 2

    return result


async def evaluate_single(q_doc: dict, student_answer: str) -> dict:
    """Run NLP + Ollama on one question."""
    nlp_result = evaluate_answer(
        student_answer=student_answer,
        model_answer=q_doc["model_answer"]
    )
    score      = nlp_result["marks"]
    similarity = nlp_result["similarity"]
    nli_result = nlp_result["nli_result"]
    max_marks  = q_doc.get("max_marks", 10)

    feedback = await generate_feedback(
        student_answer=student_answer,
        model_answer=q_doc["model_answer"],
        score=score,
        similarity=similarity,
        max_marks=max_marks,
        nli_result=nli_result
    )

    return {
        "question_number": q_doc["question_number"],
        "question_text":   q_doc["question_text"],
        "student_answer":  student_answer,
        "marks":           score,
        "max_marks":       max_marks,
        "similarity":      similarity,
        "nli_result":      nli_result,
        "feedback":        feedback
    }


# ──────────────────────────────────────────────
# ROUTE 1: Single text evaluation
# POST /evaluate/text
# ──────────────────────────────────────────────

@router.post("/text", response_model=EvaluateResponse)
async def evaluate_text(
    question_id: str = Form(...),
    answer:      str = Form(...)
):
    q            = await fetch_question_by_id(question_id)
    model_answer = q["model_answer"]
    max_marks    = q.get("max_marks", 10)

    ocr_result     = extract_text_from_string(answer)
    extracted_text = ocr_result["text"]

    if not extracted_text:
        raise HTTPException(status_code=400, detail="Answer text cannot be empty.")

    nlp_result = evaluate_answer(
        student_answer=extracted_text,
        model_answer=model_answer
    )
    score      = nlp_result["marks"]
    similarity = nlp_result["similarity"]
    nli_result = nlp_result["nli_result"]

    feedback = await generate_feedback(
        student_answer=extracted_text,
        model_answer=model_answer,
        score=score,
        similarity=similarity,
        max_marks=max_marks,
        nli_result=nli_result
    )

    await evaluations_collection.insert_one({
        "type":           "text",
        "question_id":    question_id,
        "question_text":  q["question_text"],
        "student_answer": extracted_text,
        "marks":          score,
        "max_marks":      max_marks,
        "similarity":     similarity,
        "nli_result":     nli_result,
        "feedback":       feedback,
        "created_at":     datetime.utcnow()
    })

    return EvaluateResponse(marks=score, feedback=feedback)


# ──────────────────────────────────────────────
# ROUTE 2: Batch image evaluation
# POST /evaluate/batch
# Uploads one image → evaluates all questions
# ──────────────────────────────────────────────

@router.post("/batch")
async def evaluate_batch(file: UploadFile = File(...)):
    allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
    if file.content_type not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: jpg, png, webp."
        )

    # ── Save image temporarily ──
    temp_path = os.path.join(tempfile.gettempdir(), file.filename)
    with open(temp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # ── OCR ──
    try:
        ocr_result = extract_text_from_image(temp_path)
        full_text  = ocr_result.get("text", "").strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR failed: {str(e)}")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

    if not full_text:
        raise HTTPException(status_code=422, detail="OCR returned empty text.")

    # ── Split OCR text by question number ──
    split_answers = split_ocr_by_question(full_text)

    if not split_answers:
        raise HTTPException(
            status_code=422,
            detail="Could not detect question numbers (Q1, Q2...) in the image. Make sure students write Q1, Q2 etc."
        )

    # ── Evaluate each detected answer ──
    results     = []
    total_marks = 0
    total_max   = 0
    not_found   = []

    for q_num, student_answer in sorted(split_answers.items()):
        q_doc = await fetch_question_by_number(q_num)

        if not q_doc:
            not_found.append(q_num)
            continue

        result = await evaluate_single(q_doc, student_answer)
        results.append(result)
        total_marks += result["marks"]
        total_max   += result["max_marks"]

    if not results:
        raise HTTPException(
            status_code=404,
            detail=f"Questions {not_found} found in image but not in Question Bank. Add them first."
        )

    # ── Save batch record to MongoDB ──
    await evaluations_collection.insert_one({
        "type":         "batch",
        "filename":     file.filename,
        "ocr_text":     full_text,
        "results":      results,
        "total_marks":  total_marks,
        "total_max":    total_max,
        "not_found":    not_found,
        "created_at":   datetime.utcnow()
    })

    return {
        "total_marks": total_marks,
        "total_max":   total_max,
        "results":     results,
        "not_found":   not_found
    }


# ──────────────────────────────────────────────
# ROUTE 3: Health check
# ──────────────────────────────────────────────

@router.get("/health")
def health_check():
    return {"status": "Evaluate router is running ✅"}


# ──────────────────────────────────────────────
# ROUTE 4: Past evaluations
# ──────────────────────────────────────────────

@router.get("/history")
async def get_history():
    results = []
    async for doc in evaluations_collection.find().sort("created_at", -1).limit(20):
        doc["_id"] = str(doc["_id"])
        results.append(doc)
    return {"evaluations": results}