import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { BookOpen, FileUp, Loader2, Sparkles } from "lucide-react";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [assessment, setAssessment] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAssessing, setIsAssessing] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(event) {
    event.preventDefault();

    if (!file) {
      setError("Please choose a lecture file first.");
      return;
    }

    setIsUploading(true);
    setError("");
    setResult(null);
    setQuizAnswers({});
    setAssessment(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/api/lectures/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed.");
      }

      const data = await response.json();
      setResult(data);
    } catch (uploadError) {
      setError("Backend is not reachable. Start the backend server first.");
    } finally {
      setIsUploading(false);
    }
  }

  function handleQuizAnswer(question, answer) {
    setQuizAnswers((currentAnswers) => ({
      ...currentAnswers,
      [question]: answer,
    }));
  }

  async function assessQuiz() {
    if (!result?.quiz?.length) {
      return;
    }

    setIsAssessing(true);
    setError("");

    const answers = result.quiz.map((item) => ({
      question: item.question,
      topic: item.topic,
      answer: quizAnswers[item.question] || "",
    }));

    try {
      const response = await fetch(`${API_URL}/api/quiz/assess`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        throw new Error("Assessment failed.");
      }

      const data = await response.json();
      setAssessment(data);
    } catch (assessmentError) {
      setError("Quiz assessment failed. Check that the backend is running.");
    } finally {
      setIsAssessing(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="top-bar">
        <div className="brand">
          <BookOpen size={24} />
          <span>StudyMate AI</span>
        </div>
        <span className="status">MVP 1</span>
      </section>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Lecture to learning plan</p>
          <h1>Turn class material into notes, quizzes, and revision steps.</h1>
          <p>
            Start by uploading one lecture file. For now, the backend returns a
            sample response. Next, we will add real PDF text extraction.
          </p>
        </div>

        <form className="upload-panel" onSubmit={handleUpload}>
          <div className="upload-icon">
            <FileUp size={34} />
          </div>
          <label htmlFor="lecture-file">Choose lecture file</label>
          <input
            id="lecture-file"
            type="file"
            accept=".pdf,.mp3,.mp4,.wav,.txt"
            onChange={(event) => setFile(event.target.files[0])}
          />
          {file && <p className="file-name">{file.name}</p>}
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={isUploading}>
            {isUploading ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
            Generate Notes
          </button>
        </form>
      </section>

      {result && (
        <section className="results">
          <div className="generator-pill">
            Generator: {result.generator === "gemini" ? "Gemini AI" : "Offline fallback"}
          </div>

          {result.generator_error && (
            <div className="ai-warning">
              Gemini error: {result.generator_error}
            </div>
          )}

          <div>
            <p className="section-label">Extracted Text</p>
            <pre className="extracted-text">{result.extracted_text}</pre>
          </div>

          <div>
            <p className="section-label">Summary</p>
            <p>{result.summary}</p>
          </div>

          <div>
            <p className="section-label">Notes</p>
            <ul>
              {result.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="section-label">Key Points</p>
            <ul>
              {result.key_points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="section-label">Flashcards</p>
            <div className="card-grid">
              {result.flashcards.map((card) => (
                <article className="study-card" key={card.front}>
                  <h2>{card.front}</h2>
                  <p>{card.back}</p>
                </article>
              ))}
            </div>
          </div>

          <div>
            <p className="section-label">Quiz</p>
            <div className="quiz-list">
              {result.quiz.map((item, index) => (
                <article className="quiz-item" key={item.question}>
                  <h2>Question {index + 1}</h2>
                  <p>{item.question}</p>
                  <span>{item.topic}</span>
                  <textarea
                    aria-label={`Answer for question ${index + 1}`}
                    placeholder="Type your answer here"
                    value={quizAnswers[item.question] || ""}
                    onChange={(event) => handleQuizAnswer(item.question, event.target.value)}
                  />
                </article>
              ))}
            </div>
            <button className="secondary-button" type="button" onClick={assessQuiz} disabled={isAssessing}>
              {isAssessing ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
              Detect Knowledge Gaps
            </button>
          </div>

          {assessment && (
            <div className="gap-report">
              <p className="section-label">Knowledge Gap Detector</p>
              <h2>{assessment.message}</h2>
              <p>
                Weak topics: <strong>{assessment.weak_topics.join(", ")}</strong>
              </p>
              <ol className="revision-plan">
                {assessment.personal_plan.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          <div>
            <p className="section-label">Revision Plan</p>
            <ol className="revision-plan">
              {result.revision_plan.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </section>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
