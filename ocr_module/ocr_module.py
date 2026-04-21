import base64
import re
import os
from openai import OpenAI


def extract_text_from_image(image_path: str) -> dict:
    """
    Takes an image file path, sends it to GPT-4o-mini,
    returns extracted handwritten text.
    Client created inside function so backend starts without OPENAI_API_KEY.
    """
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    with open(image_path, "rb") as image_file:
        base64_image = base64.b64encode(image_file.read()).decode("utf-8")

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Extract all handwritten text from this image clearly. Return only the text. Do not add explanations."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
            }
        ],
        max_tokens=1000
    )

    text = response.choices[0].message.content
    text = re.sub(r'\s+', ' ', text).strip()

    return {"text": text}


def extract_text_from_string(text: str) -> dict:
    # Text is already plain — just clean and return it
    text = re.sub(r'\s+', ' ', text).strip()
    return {"text": text}