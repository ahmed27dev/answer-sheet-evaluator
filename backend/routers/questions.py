from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime

from database import db

router = APIRouter(
    prefix="/questions",
    tags=["Questions"]
)


class QuestionCreate(BaseModel):
    question_number: int        # Q1=1, Q2=2, Q3=3 ...
    subject:         str
    question_text:   str
    model_answer:    str
    max_marks:       int = 10


@router.post("/")
async def create_question(data: QuestionCreate):
    # Prevent duplicate question numbers
    existing = await db["questions"].find_one({"question_number": data.question_number})
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Q{data.question_number} already exists. Delete it first to replace."
        )
    doc = {
        "question_number": data.question_number,
        "subject":         data.subject,
        "question_text":   data.question_text,
        "model_answer":    data.model_answer,
        "max_marks":       data.max_marks,
        "created_at":      datetime.utcnow()
    }
    result = await db["questions"].insert_one(doc)
    return {
        "message": f"Q{data.question_number} saved successfully.",
        "id": str(result.inserted_id)
    }


@router.get("/")
async def list_questions():
    """List all questions sorted by question number."""
    questions = []
    async for q in db["questions"].find().sort("question_number", 1):
        questions.append({
            "id":              str(q["_id"]),
            "question_number": q.get("question_number"),
            "subject":         q.get("subject", ""),
            "question_text":   q.get("question_text", ""),
            "model_answer": q.get("model_answer", ""),
            "max_marks":       q.get("max_marks", 10)
        })
    return {"questions": questions}


@router.get("/{question_id}")
async def get_question(question_id: str):
    try:
        q = await db["questions"].find_one({"_id": ObjectId(question_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid question ID.")
    if not q:
        raise HTTPException(status_code=404, detail="Question not found.")
    return {
        "id":              str(q["_id"]),
        "question_number": q["question_number"],
        "subject":         q["subject"],
        "question_text":   q["question_text"],
        "model_answer":    q["model_answer"],
        "max_marks":       q["max_marks"]
    }


@router.delete("/{question_id}")
async def delete_question(question_id: str):
    try:
        result = await db["questions"].delete_one({"_id": ObjectId(question_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid question ID.")
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Question not found.")
    return {"message": "Question deleted."}