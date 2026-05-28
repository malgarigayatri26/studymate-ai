from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.pdf_reader import extract_pdf_text
from app.study_generator import generate_study_material

app = FastAPI(title="StudyMate AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "StudyMate AI backend is running"}


@app.post("/api/lectures/upload")
async def upload_lecture(file: UploadFile = File(...)):
    file_bytes = await file.read()
    extracted_text = ""

    if file.content_type == "application/pdf" or file.filename.lower().endswith(".pdf"):
        extracted_text = extract_pdf_text(file_bytes)

    if not extracted_text:
        extracted_text = (
            "No readable PDF text found yet. Upload a text-based PDF lecture file. "
            "Scanned image PDFs need OCR, which we will add later."
        )

    study_material = generate_study_material(extracted_text)

    return {
        "file_name": file.filename,
        "content_type": file.content_type,
        "extracted_text": extracted_text,
        "notes": study_material["key_points"],
        "summary": study_material["summary"],
        "key_points": study_material["key_points"],
        "flashcards": study_material["flashcards"],
        "quiz": study_material["quiz"],
        "revision_plan": study_material["revision_plan"],
    }
