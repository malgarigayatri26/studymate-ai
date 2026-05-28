from io import BytesIO

from pypdf import PdfReader


def extract_pdf_text(file_bytes: bytes) -> str:
    pdf = PdfReader(BytesIO(file_bytes))
    page_text = []

    for page_number, page in enumerate(pdf.pages, start=1):
        text = page.extract_text() or ""
        text = text.strip()

        if text:
            page_text.append(f"Page {page_number}\n{text}")

    return "\n\n".join(page_text)
