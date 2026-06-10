import base64
import re
import os
from openai import OpenAI


def extract_text_from_image(image_path: str) -> dict:
    """
    Takes an image file path, sends it to GPT-4o-mini,
    returns extracted handwritten text while preserving
    question numbering and line structure.
    Also extracts PRN number if present on the sheet.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY is not set")

    client = OpenAI(api_key=api_key)

    with open(image_path, "rb") as image_file:
        base64_image = base64.b64encode(image_file.read()).decode("utf-8")

    ext = os.path.splitext(image_path)[1].lower()
    if ext == ".png":
        mime_type = "image/png"
    elif ext == ".webp":
        mime_type = "image/webp"
    else:
        mime_type = "image/jpeg"

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "Extract all handwritten and printed text from this answer sheet exactly as it appears. "
                            "Preserve line breaks, numbering, question labels like Q1, Q2, Question 1, "
                            "and subparts like a), b), i), ii). "
                            "Do not merge different answers together. "
                            "Do not summarize or explain anything. "
                            "If you find a PRN number, roll number, or student ID on the sheet, "
                            "output it on the very first line in this exact format: PRN: <number> "
                            "Then return the rest of the extracted text below it."
                        )
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{base64_image}"
                        }
                    }
                ]
            }
        ],
        max_tokens=1500
    )

    text = response.choices[0].message.content or ""

    # Extract PRN from first line if present
    prn = None
    lines = text.strip().splitlines()
    if lines and re.match(r"^PRN\s*:\s*\S+", lines[0], re.IGNORECASE):
        prn = re.sub(r"^PRN\s*:\s*", "", lines[0], flags=re.IGNORECASE).strip()
        text = "\n".join(lines[1:]).strip()

    # preserve line structure instead of flattening everything
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()

    return {"text": text, "prn": prn}


def extract_text_from_string(text: str) -> dict:
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return {"text": text}