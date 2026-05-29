# StudyMate AI

StudyMate AI is a lecture notes generator for students.

In the final version, a student can upload a PDF, audio, or video lecture and get:

- Clean notes
- Short summary
- Key points
- Flashcards
- Quiz questions
- A revision plan
- Knowledge gap detection based on quiz mistakes

The app uses Groq AI when `GROQ_API_KEY` is configured, or Gemini AI when `GEMINI_API_KEY` is configured. If no key is available, it uses a simple offline generator so the project still works.

## Project Parts

This project has two main folders:

```text
backend/
frontend/
```

## Backend

The backend is the server. It receives files, processes them, talks to AI later, and sends results back to the frontend.

We use:

```text
Python + FastAPI
```

## Frontend

The frontend is the screen the student uses.

We use:

```text
React + Vite
```

## How To Run

Open two terminals.

### Terminal 1: Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs here:

```text
http://127.0.0.1:8000
```

### Terminal 2: Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs here:

```text
http://localhost:5173
```

## First Goal

Our first goal is simple:

```text
Upload a lecture file and show a sample generated notes response.
```

After that works, we will add real PDF text extraction and AI.

## Deployment

Deployment steps are in:

```text
DEPLOYMENT.md
```
