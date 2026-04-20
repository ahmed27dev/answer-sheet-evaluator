from pydantic import BaseModel
from typing import Optional

# ──────────────────────────────────────────────
# Request Models (what the API receives)
# ──────────────────────────────────────────────

class EvaluateRequest(BaseModel):
    """
    Sent by frontend when submitting an answer sheet.
    'answer_text' is used when text is passed directly (e.g., from OCR mock).
    """
    answer_text: Optional[str] = None
    question: Optional[str] = None
    max_marks: Optional[int] = 10


# ──────────────────────────────────────────────
# Response Models (what the API sends back)
# ──────────────────────────────────────────────

class OCRResult(BaseModel):
    """Matches OCR module output contract: { 'text': '...' }"""
    text: str


class NLPResult(BaseModel):
    """Matches NLP module output contract: { 'score': 7, 'similarity': 0.78 }"""
    score: int
    similarity: float


class EvaluateResponse(BaseModel):
    """Final output contract: { 'marks': 7, 'feedback': '...' }"""
    marks: int
    feedback: str