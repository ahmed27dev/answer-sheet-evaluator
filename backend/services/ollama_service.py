# ──────────────────────────────────────────────
# Feedback Service (Ollama + OpenAI Switch)
# ──────────────────────────────────────────────

import httpx
import os
from openai import OpenAI

# ── CONFIG ───────────────────────────────────

OLLAMA_URL   = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "mistral:latest"

# OpenAI client (used only if selected)
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# ──────────────────────────────────────────────
# MAIN FUNCTION
# ──────────────────────────────────────────────

async def generate_feedback(
    student_answer: str,
    model_answer: str,
    score: int,
    similarity: float,
    max_marks: int,
    nli_result: str,
    feedback_mode: str = "ollama"
) -> str:
    """
    Generates feedback using:
    - Ollama (local model)
    - OpenAI (cloud model)
    """

    prompt = f"""You are an expert teacher evaluating a student's answer.

Question Model Answer (Expected):
\"\"\"{model_answer}\"\"\"

Student's Answer:
\"\"\"{student_answer}\"\"\"

Evaluation Results:
- Marks Awarded : {score} out of {max_marks}
- Similarity    : {round(similarity * 100, 1)}%
- NLI Result    : {nli_result}

Your Task:
Write short, constructive feedback (3-4 sentences) for the student.
- Mention what they got right.
- Point out what is missing or incorrect compared to the expected answer.
- Encourage them to improve.
- Keep the tone friendly and professional.

Return ONLY the feedback text. No headings, no bullet points, no extra explanation.
""".strip()

    # ──────────────────────────────────────────
    # OPTION 1: OPENAI (FAST DEMO MODE)
    # ──────────────────────────────────────────
    if feedback_mode == "openai":
        try:
            response = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "user", "content": prompt}
                ],
                max_tokens=150
            )
            return response.choices[0].message.content.strip()

        except Exception as e:
            return f"OpenAI feedback failed: {str(e)}"

    # ──────────────────────────────────────────
    # OPTION 2: OLLAMA (DEFAULT LOCAL MODE)
    # ──────────────────────────────────────────
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(OLLAMA_URL, json=payload)
            response.raise_for_status()
            data = response.json()
            return data.get("response", "Feedback unavailable.").strip()

    except httpx.RequestError:
        return "Feedback unavailable: Could not connect to Ollama. Make sure it is running."

    except Exception as e:
        return f"Feedback unavailable: {str(e)}"