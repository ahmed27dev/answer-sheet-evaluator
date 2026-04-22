from pydantic import BaseModel
from typing import Optional

# ──────────────────────────────────────────────
# Request Models (what the API receives)
# ──────────────────────────────────────────────

class EvaluateRequest(BaseModel):
    """
    Sent by frontend when submitting an answer sheet.
    'answer_text' is used when text is passed directly.
    """
    answer_text: Optional[str] = None
    question: Optional[str] = None

    # UPDATED: allow float-compatible marks if needed in future
    max_marks: Optional[float] = 10


# ──────────────────────────────────────────────
# Response Models (what the API sends back)
# ──────────────────────────────────────────────

class OCRResult(BaseModel):
    """Matches OCR module output contract: { 'text': '...' }"""
    text: str


class NLPResult(BaseModel):
    """
    UPDATED:
    changed score from int -> float
    so partial scores like 1.5 are not lost
    """
    score: float
    similarity: float


class EvaluateResponse(BaseModel):
    """
    UPDATED:
    changed marks from int -> float
    so teacher-style partial marks like 1.5 / 2 are preserved
    """
    marks: float
    feedback: str