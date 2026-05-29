import os

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.ai_generator import (
    can_use_gemini,
    can_use_groq,
    generate_ai_study_material,
    generate_groq_study_material,
)
from app.pdf_reader import extract_pdf_text
from app.study_generator import generate_study_material

app = FastAPI(title="StudyMate AI API")

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class QuizAnswer(BaseModel):
    question: str
    topic: str
    answer: str


class QuizAssessmentRequest(BaseModel):
    answers: list[QuizAnswer]


@app.get("/")
def root():
    return {"message": "StudyMate AI backend is running"}


@app.get("/api/health")
def health():
    return {
        "message": "StudyMate AI backend is running",
        "gemini_configured": can_use_gemini(),
        "gemini_model": os.getenv("GEMINI_MODEL", "gemini-2.0-flash"),
        "groq_configured": can_use_groq(),
        "groq_model": os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
    }


@app.post("/api/lectures/upload")
async def upload_lecture(file: UploadFile = File(...)):
    file_bytes = await file.read()
    extracted_text = ""
    generator_error = ""

    if file.content_type == "application/pdf" or file.filename.lower().endswith(".pdf"):
        extracted_text = extract_pdf_text(file_bytes)

    if not extracted_text:
        extracted_text = (
            "No readable PDF text found yet. Upload a text-based PDF lecture file. "
            "Scanned image PDFs need OCR, which we will add later."
        )

    generator = "offline"

    if can_use_groq():
        try:
            study_material = generate_groq_study_material(extracted_text)
            generator = "groq"
        except Exception as error:
            generator_error = str(error)
            print(f"Groq generation failed: {error}")
            study_material = generate_study_material(extracted_text)
            generator = "offline_fallback"
    elif can_use_gemini():
        try:
            study_material = generate_ai_study_material(extracted_text)
            generator = "gemini"
        except Exception as error:
            generator_error = str(error)
            print(f"Gemini generation failed: {error}")
            study_material = generate_study_material(extracted_text)
            generator = "offline_fallback"
    else:
        study_material = generate_study_material(extracted_text)

    return {
        "file_name": file.filename,
        "content_type": file.content_type,
        "generator": generator,
        "generator_error": generator_error,
        "extracted_text": extracted_text,
        "notes": study_material["key_points"],
        "summary": study_material["summary"],
        "key_points": study_material["key_points"],
        "flashcards": study_material["flashcards"],
        "quiz": study_material["quiz"],
        "revision_plan": study_material["revision_plan"],
    }


@app.post("/api/quiz/assess")
def assess_quiz(request: QuizAssessmentRequest):
    weak_topics = []
    strong_topics = []

    for answer in request.answers:
        cleaned_answer = answer.answer.strip()

        if len(cleaned_answer.split()) < 8:
            weak_topics.append(answer.topic)
        else:
            strong_topics.append(answer.topic)

    if not weak_topics:
        weak_topics = ["revision"]

    personal_plan = [
        f"Revise {topic} with one short definition and one example."
        for topic in weak_topics
    ]
    personal_plan.extend(
        [
            "Create one handwritten note for each weak topic.",
            "Try the same quiz again after revising.",
            "Review strong topics once after 2 days so you do not forget them.",
        ]
    )

    return {
        "weak_topics": weak_topics,
        "strong_topics": strong_topics,
        "personal_plan": personal_plan,
        "message": "Knowledge gaps detected from your quiz answers.",
    }
