import re
import torch
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# =========================================================
# LOAD MODELS
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
        student_answer,
        model_answer,
        return_tensors="pt",
        truncation=True,
        padding=True
    )
    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        logits = nli_model(**inputs).logits
        probs = torch.softmax(logits, dim=1)[0]

    pred_id = torch.argmax(probs).item()
    return labels[pred_id], float(probs[pred_id].item())


def split_into_sentences(text: str):
    parts = re.split(r"[\n.!?]+", text)
    return [clean_text(p) for p in parts if len(p.split()) >= 3]

# =========================================================
# CONTRADICTION DETECTION (IMPROVED)
# =========================================================
def detect_factual_contradictions(student_sentences, model_points):
    contradiction_count = 0
    contradiction_penalty = 0.0

    for s in student_sentences:
        for m in model_points:
            sim = get_similarity(s, m)

            if sim >= 0.35:
                label, conf = check_nli(s, m)

                if label == "CONTRADICTION" and conf >= 0.60:
                    contradiction_count += 1
                    contradiction_penalty += (0.25 + 0.2 * (sim - 0.35))

    contradiction_penalty = min(contradiction_penalty, 0.7)

    return contradiction_count, contradiction_penalty

# =========================================================
# LONG ANSWER EVALUATOR (FINAL VERSION)
# =========================================================
def evaluate_long_answer(student_answer, model_answer, max_marks):

    student_sentences = split_into_sentences(student_answer)
    model_points = split_into_sentences(model_answer)

    if not student_sentences:
        return {"marks": 0, "feedback": "No answer provided.", "similarity": 0.0, "nli_result": "NEUTRAL"}

    total_score = 0
    total_similarity = 0

    for point in model_points:
        best_sim = 0
        best_line = ""

        for line in student_sentences:
            sim = get_similarity(line, point)
            if sim > best_sim:
                best_sim = sim
                best_line = line

        total_similarity += best_sim
        nli, _ = check_nli(best_line, point)

        if nli == "ENTAILMENT":
            score = 1 if best_sim >= 0.65 else 0.75
        elif nli == "NEUTRAL":
            score = 0.75 if best_sim >= 0.6 else 0.5 if best_sim >= 0.4 else 0.25
        else:
            score = 0

        total_score += score

    coverage = total_score / max(len(model_points), 1)
    avg_similarity = total_similarity / max(len(model_points), 1)

    # =========================================================
    # FIX 1: HARD COVERAGE CAPS
    # =========================================================
    final_score = coverage

    if coverage < 0.4:
        final_score = min(final_score, 0.5)
    elif coverage < 0.6:
        final_score = min(final_score, 0.7)
    elif coverage < 0.8:
        final_score = min(final_score, 0.85)

    # =========================================================
    # FIX 5: MISSING POINT PENALTY
    # =========================================================
    missing_points = len(model_points) - round(coverage * len(model_points))
    if missing_points >= 2:
        final_score *= 0.8

    # =========================================================
    # FIX 2: STRONG CONTRADICTION PENALTY
    # =========================================================
    contradiction_count, contradiction_penalty = detect_factual_contradictions(
        student_sentences, model_points
    )

    if contradiction_count > 0:
        final_score *= (1 - contradiction_penalty)

    if contradiction_count >= 2:
        final_score = min(final_score, 0.4)
    elif contradiction_count == 1:
        final_score = min(final_score, 0.65)

    # =========================================================
    # FIX 3: HIGH SIMILARITY BUT WRONG
    # =========================================================
    if avg_similarity > 0.7 and contradiction_count > 0:
        final_score *= 0.7

    final_score = max(0.0, min(final_score, 1.0))
    marks = round(final_score * max_marks, 1)

    # Feedback
    if final_score >= 0.8:
        feedback = "Good answer."
        nli_result = "ENTAILMENT"
    elif final_score >= 0.4:
        feedback = "Partial answer."
        nli_result = "NEUTRAL"
    else:
        feedback = "Incorrect answer."
        nli_result = "CONTRADICTION"

    return {
        "marks": marks,
        "feedback": feedback,
        "similarity": round(avg_similarity, 4),
        "nli_result": nli_result,
        "contradiction_count": contradiction_count
    }

# =========================================================
# MAIN FUNCTION
# =========================================================
def evaluate_answer(student_answer, model_answer, max_marks):

    if not student_answer.strip():
        return {"marks": 0, "feedback": "No answer.", "similarity": 0.0, "nli_result": "NEUTRAL"}

    if len(student_answer.split()) > 40 or len(model_answer.split()) > 40:
        return evaluate_long_answer(student_answer, model_answer, max_marks)

    student_clean = clean_text(student_answer)
    model_clean = clean_text(model_answer)

    similarity = get_similarity(student_clean, model_clean)
    nli, _ = check_nli(student_answer, model_answer)

    # =========================================================
    # FIX 4: STRICT SHORT ANSWER
    # =========================================================
    if nli == "ENTAILMENT":
        final_score = 0.85 + 0.15 * similarity
    elif nli == "NEUTRAL":
        final_score = 0.4 + 0.25 * similarity
    else:
        final_score = 0.1 + 0.15 * similarity

    final_score = min(final_score, 1.0)
    marks = round(final_score * max_marks, 1)

    return {
        "marks": marks,
        "feedback": "Evaluated answer.",
        "similarity": round(similarity, 4),
        "nli_result": nli
    }