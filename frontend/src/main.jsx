import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { BookOpen, FileUp, Loader2, Sparkles } from "lucide-react";
import "./styles.css";

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
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

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/lectures/upload", {
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
        </section>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
