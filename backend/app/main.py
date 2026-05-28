from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.pdf_reader import extract_pdf_text

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

    return {
        "file_name": file.filename,
        "content_type": file.content_type,
        "extracted_text": extracted_text,
        "notes": [
            "PDF extraction is now connected.",
            "The backend can read text-based PDF lecture files.",
            "Next, we will send this extracted text to AI for real notes.",
        ],
        "summary": "PDF text extraction is ready for text-based lecture files.",
        "key_points": [
            "Frontend can send a file.",
            "Backend can receive and read a PDF.",
            "The extracted text can now become AI notes.",
        ],
    }
