import json
import os

import requests
from google import genai


def can_use_gemini() -> bool:
    return bool(os.getenv("GEMINI_API_KEY"))


def can_use_groq() -> bool:
    return bool(os.getenv("GROQ_API_KEY"))


def clean_json_response(raw_text: str) -> dict:
    raw_text = raw_text.strip()

    if raw_text.startswith("```"):
        raw_text = raw_text.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    return json.loads(raw_text)


def build_study_prompt(text: str) -> str:
    return f"""
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


def generate_ai_study_material(text: str) -> dict:
    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

    prompt = build_study_prompt(text)
    response = client.models.generate_content(model=model, contents=prompt)
    return clean_json_response(response.text)


def generate_groq_study_material(text: str) -> dict:
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {os.environ['GROQ_API_KEY']}",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": "You create student study material and return only valid JSON.",
                },
                {"role": "user", "content": build_study_prompt(text)},
            ],
            "temperature": 0.3,
            "response_format": {"type": "json_object"},
        },
        timeout=45,
    )
    response.raise_for_status()
    data = response.json()
    return clean_json_response(data["choices"][0]["message"]["content"])
