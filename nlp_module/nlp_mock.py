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
def clean_text(text):
    text = text.lower()
    text = re.sub(r"[^a-zA-Z0-9\s]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def get_similarity(a, b):
    embeddings = similarity_model.encode([a, b])
    sim = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
    return float(sim)


def check_nli(student_answer, model_answer):
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


# =========================================================
# MAIN FUNCTION — called by backend/routers/evaluate.py
# =========================================================
def evaluate_answer(student_answer: str, model_answer: str) -> dict:
    """
    Evaluates a student answer against a model answer.

    Args:
        student_answer: The student's answer (text)
        model_answer:   The expected correct answer (text)

    Returns:
        dict with keys:
            - marks        (int, 0–10)
            - feedback     (str)
            - similarity   (float, 0–1)
            - nli_result   (str: ENTAILMENT / NEUTRAL / CONTRADICTION)
    """
    student_clean = clean_text(student_answer)
    model_clean = clean_text(model_answer)

    # Empty answer
    if not student_clean:
        return {
            "marks": 0,
            "feedback": "No answer was provided.",
            "similarity": 0.0,
            "nli_result": "NEUTRAL"
        }

    # Similarity score
    similarity = get_similarity(student_clean, model_clean)

    # NLI check
    nli_result, nli_confidence = check_nli(student_answer, model_answer)

    # Fix: if high similarity but flagged as contradiction, downgrade to neutral
    if similarity > 0.75 and nli_result == "CONTRADICTION":
        nli_result = "NEUTRAL"

    # Final score calculation
    if nli_result == "ENTAILMENT":
        final_score = 0.85 + (0.15 * similarity)
        feedback = "Good answer. The response is correct and matches the expected meaning."
    elif nli_result == "NEUTRAL":
        final_score = 0.45 + (0.35 * similarity)
        feedback = "Partial answer. The response is related but incomplete or unclear."
    else:
        final_score = 0.10 + (0.15 * similarity)
        feedback = "Incorrect answer. The response contradicts the expected meaning."

    final_score = min(float(final_score), 1.0)

    # Convert to marks out of 10
    marks = round(final_score * 10)

    return {
        "marks": marks,
        "feedback": feedback,
        "similarity": round(similarity, 4),
        "nli_result": nli_result
    }


    