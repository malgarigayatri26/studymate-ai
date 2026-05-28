import json
import os

from google import genai


def can_use_gemini() -> bool:
    return bool(os.getenv("GEMINI_API_KEY"))


def generate_ai_study_material(text: str) -> dict:
    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

    prompt = f"""
Create study material from this lecture text.

Return only valid JSON with exactly these keys:
summary: string
key_points: array of 5 strings
flashcards: array of 5 objects with front and back
quiz: array of 5 objects with question, answer, and topic
revision_plan: array of 4 strings

Lecture text:
{text[:12000]}
"""

    response = client.models.generate_content(model=model, contents=prompt)
    raw_text = response.text.strip()

    if raw_text.startswith("```"):
        raw_text = raw_text.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    return json.loads(raw_text)
