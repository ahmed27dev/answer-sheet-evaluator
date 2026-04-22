import re
import torch
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# =========================================================
# LOAD MODELS (loaded once when module is imported)
# =========================================================
print("Loading NLP models...")

similarity_model = SentenceTransformer("all-MiniLM-L6-v2")

nli_model_name = "facebook/bart-large-mnli"
tokenizer = AutoTokenizer.from_pretrained(nli_model_name)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
nli_model = AutoModelForSequenceClassification.from_pretrained(nli_model_name).to(device)
nli_model.eval()

labels = ["CONTRADICTION", "NEUTRAL", "ENTAILMENT"]

print("NLP models loaded successfully.")


# =========================================================
# HELPERS
# =========================================================
def clean_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-zA-Z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def get_similarity(a: str, b: str) -> float:
    embeddings = similarity_model.encode([a, b])
    sim = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
    return float(sim)


def check_nli(student_answer: str, model_answer: str):
    inputs = tokenizer(
        model_answer,
        student_answer,
        return_tensors="pt",
        truncation=True,
        padding=True
    )
    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        logits = nli_model(**inputs).logits
        probs = torch.softmax(logits, dim=1)[0]

    pred_id = torch.argmax(probs).item()
    label = labels[pred_id]
    confidence = float(probs[pred_id].item())

    return label, confidence


def split_into_sentences(text: str):
    """
    General sentence splitter for any subject.
    Splits on newline and punctuation.
    """
    parts = re.split(r"[\n.!?]+", text)

    sentences = []
    for part in parts:
        part = clean_text(part)
        if len(part.split()) >= 3:
            sentences.append(part)

    return sentences


# =========================================================
# TEACHER-LIKE LONG ANSWER EVALUATOR
# =========================================================
def evaluate_long_answer(student_answer: str, model_answer: str, max_marks: int) -> dict:
    """
    UPDATED:
    - Uses sentence-wise semantic matching
    - Uses softer scoring thresholds
    - Uses coverage-based boosting
    - Returns decimal marks like 1.5 / 2 when needed
    """

    student_sentences = split_into_sentences(student_answer)
    model_points = split_into_sentences(model_answer)

    if not student_sentences:
        return {
            "marks": 0,
            "feedback": "No answer was provided.",
            "similarity": 0.0,
            "nli_result": "NEUTRAL"
        }

    if not model_points:
        model_points = [clean_text(model_answer)]

    total_score = 0.0
    total_similarity = 0.0

    for point in model_points:
        best_sim = 0.0
        best_line = ""

        for line in student_sentences:
            sim = get_similarity(line, point)
            if sim > best_sim:
                best_sim = sim
                best_line = line

        total_similarity += best_sim

        nli_result, _ = check_nli(best_line, point)

        # -------------------------------------------------
        # UPDATED: Teacher-like softer scoring thresholds
        # -------------------------------------------------
        if nli_result == "ENTAILMENT":
            if best_sim >= 0.65:   # lowered from 0.75
                score = 1.0
            else:
                score = 0.75

        elif nli_result == "NEUTRAL":
            if best_sim >= 0.60:
                score = 0.75
            elif best_sim >= 0.40:
                score = 0.5
            elif best_sim >= 0.25:
                score = 0.25
            else:
                score = 0.0

        else:  # CONTRADICTION
            # UPDATED: softened contradiction penalty
            if best_sim >= 0.65:
                score = 0.5
            else:
                score = 0.0
 
        total_score += score

    # -------------------------------------------------
    # UPDATED: coverage-based boost instead of strict average
    # This helps teacher-like marking for OCR/noisy answers
    # -------------------------------------------------
    coverage = total_score / max(len(model_points), 1)
    avg_similarity = total_similarity / max(len(model_points), 1)
    student_full = clean_text(student_answer)
    model_full = clean_text(model_answer)
    # NEW: general structure bonus for well-organized theory answers
    structure_bonus = 0.0

# (a), (b), (c)
    if re.search(r"\(\s*[a-z]\s*\)", student_answer.lower()):
        structure_bonus += 0.05

# 1), 2), 3) or i), ii)
    if re.search(r"\b\d+\)", student_answer) or re.search(r"\b(i|ii|iii|iv)\b", student_answer.lower()):
        structure_bonus += 0.10
    
    model_words = [w for w in model_full.split() if len(w) > 4]
    overlap_ratio = 0.0

    if model_words:
        overlap_ratio = sum(1 for w in set(model_words) if w in student_full) / len(set(model_words))
    if coverage >= 0.65 or avg_similarity >= 0.75 or overlap_ratio >= 0.55:
        final_score = 1.0
    elif coverage >= 0.6:
        final_score = max(coverage, 0.8)
    elif coverage >= 0.4:
        final_score = max(coverage, 0.6)
    else:
        final_score = coverage
    final_score = min(final_score + structure_bonus, 1.0)
        

    avg_similarity = total_similarity / max(len(model_points), 1)
    # -------------------------------------------------
# NEW: minor deduction for weak expression
# -------------------------------------------------
    is_descriptive = len(model_answer.split()) > 40
    if final_score == 1.0 and is_descriptive:
        if avg_similarity < 0.85:
            final_score = 0.8   # reduces to ~1.6/2

    # -------------------------------------------------
    # UPDATED: allow decimal marks like 1.5 / 2
    # -------------------------------------------------
    marks = round(final_score * max_marks, 1)

    if final_score >= 0.8:
        feedback = "Good answer. Most expected points are covered correctly."
        overall_nli = "ENTAILMENT"
    elif final_score >= 0.4:
        feedback = "Partial answer. Some expected points are covered."
        overall_nli = "NEUTRAL"
    else:
        feedback = "Incorrect or incomplete answer."
        overall_nli = "CONTRADICTION"

    return {
        "marks": marks,
        "feedback": feedback,
        "similarity": round(avg_similarity, 4),
        "nli_result": overall_nli
    }


# =========================================================
# MAIN FUNCTION — called by backend/routers/evaluate.py
# =========================================================
def evaluate_answer(student_answer: str, model_answer: str, max_marks: int) -> dict:
    """
    Evaluates a student answer against a model answer.

    Uses:
    - NLI + similarity for short answers
    - sentence-wise semantic scoring for long answers
    """

    if not student_answer or not student_answer.strip():
        return {
            "marks": 0,
            "feedback": "No answer was provided.",
            "similarity": 0.0,
            "nli_result": "NEUTRAL"
        }

    # -------------------------------------------------
    # Long answer mode
    # -------------------------------------------------
    if len(student_answer.split()) > 40 or len(model_answer.split()) > 40:
        return evaluate_long_answer(student_answer, model_answer, max_marks)

    # -------------------------------------------------
    # Short answer mode
    # -------------------------------------------------
    student_clean = clean_text(student_answer)
    model_clean = clean_text(model_answer)

    similarity = get_similarity(student_clean, model_clean)
    nli_result, _ = check_nli(student_answer, model_answer)

    # -------------------------------------------------
    # UPDATED: soften contradiction if similarity is decent
    # -------------------------------------------------
    if similarity > 0.65 and nli_result == "CONTRADICTION":
        nli_result = "NEUTRAL"

    # -------------------------------------------------
    # UPDATED: teacher-like short-answer scoring
    # -------------------------------------------------
    if nli_result == "ENTAILMENT":
        final_score = 0.88 + (0.12 * similarity)
        feedback = "Good answer. The response is correct."
    elif nli_result == "NEUTRAL":
        final_score = 0.55 + (0.30 * similarity)
        feedback = "Partial answer."
    else:
        final_score = 0.20 + (0.20 * similarity)
        feedback = "Incorrect answer."

    final_score = min(float(final_score), 1.0)

    # NOTE:
    # Short answers still return rounded integer marks.
    # If you also want decimal marks for short answers,
    # change this line to:
    # marks = round(final_score * max_marks, 1)
    marks = min(round(final_score * max_marks), max_marks)

    return {
        "marks": marks,
        "feedback": feedback,
        "similarity": round(similarity, 4),
        "nli_result": nli_result
    }