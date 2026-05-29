import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BookOpen, FileUp, Loader2, LogOut, Save, Sparkles, Trash2 } from "lucide-react";
import { isSupabaseConfigured, supabase } from "./supabaseClient";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function getGeneratorLabel(generator) {
  if (generator === "gemini") {
    return "Gemini AI";
  }

  if (generator === "groq") {
    return "Groq AI";
  }

  return "Offline fallback";
}

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [assessment, setAssessment] = useState(null);
  const [session, setSession] = useState(null);
  const [authMode, setAuthMode] = useState("signin");
  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [savedNotes, setSavedNotes] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAssessing, setIsAssessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session) {
      loadSavedNotes();
    } else {
      setSavedNotes([]);
    }
  }, [session]);

  async function handleAuth(event) {
    event.preventDefault();

    if (!supabase) {
      setError("Supabase is not configured yet.");
      return;
    }

    setError("");
    setMessage("");

    const authAction =
      authMode === "signup"
        ? supabase.auth.signUp(authForm)
        : supabase.auth.signInWithPassword(authForm);

    const { error: authError } = await authAction;

    if (authError) {
      setError(authError.message);
      return;
    }

    setMessage(authMode === "signup" ? "Account created. You are signed in." : "Signed in successfully.");
    setAuthForm({ email: "", password: "" });
  }

  async function signOut() {
    await supabase.auth.signOut();
    setResult(null);
    setMessage("Signed out.");
  }

  async function loadSavedNotes() {
    if (!supabase || !session) {
      return;
    }

    const { data, error: notesError } = await supabase
      .from("saved_notes")
      .select("id, file_name, summary, study_material, created_at")
      .order("created_at", { ascending: false });

    if (notesError) {
      setError(notesError.message);
      return;
    }

    setSavedNotes(data || []);
  }

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

  async function saveCurrentNotes() {
    if (!supabase || !session || !result) {
      setError("Sign in before saving notes.");
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    const { error: saveError } = await supabase.from("saved_notes").insert({
      user_id: session.user.id,
      file_name: result.file_name,
      summary: result.summary,
      extracted_text: result.extracted_text,
      study_material: {
        notes: result.notes,
        key_points: result.key_points,
        flashcards: result.flashcards,
        quiz: result.quiz,
        revision_plan: result.revision_plan,
        generator: result.generator,
      },
    });

    if (saveError) {
      setError(saveError.message);
    } else {
      setMessage("Notes saved to your dashboard.");
      await loadSavedNotes();
    }

    setIsSaving(false);
  }

  async function deleteSavedNote(noteId) {
    const { error: deleteError } = await supabase.from("saved_notes").delete().eq("id", noteId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await loadSavedNotes();
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
        <div className="top-actions">
          {session && <span className="user-email">{session.user.email}</span>}
          {session && (
            <button className="icon-button" type="button" onClick={signOut} aria-label="Sign out">
              <LogOut size={18} />
            </button>
          )}
          <span className="status">MVP 2</span>
        </div>
      </section>

      <section className="auth-strip">
        {isSupabaseConfigured ? (
          session ? (
            <div className="auth-message">
              <strong>Signed in.</strong> You can save generated notes to your dashboard.
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleAuth}>
              <div className="auth-tabs">
                <button
                  className={authMode === "signin" ? "tab active" : "tab"}
                  type="button"
                  onClick={() => setAuthMode("signin")}
                >
                  Sign in
                </button>
                <button
                  className={authMode === "signup" ? "tab active" : "tab"}
                  type="button"
                  onClick={() => setAuthMode("signup")}
                >
                  Sign up
                </button>
              </div>
              <input
                type="email"
                placeholder="Email"
                value={authForm.email}
                onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={authForm.password}
                onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
                required
                minLength={6}
              />
              <button type="submit">{authMode === "signup" ? "Create Account" : "Sign In"}</button>
            </form>
          )
        ) : (
          <div className="auth-message">
            Supabase is not configured yet. Add Vercel environment variables to enable login and saved notes.
          </div>
        )}
      </section>

      {(message || error) && (
        <section className={error ? "notice error-notice" : "notice"}>
          {error || message}
        </section>
      )}

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
            Generator: {getGeneratorLabel(result.generator)}
          </div>

          {result.generator_error && (
            <div className="ai-warning">
              Gemini error: {result.generator_error}
            </div>
          )}

          {session && (
            <button className="secondary-button" type="button" onClick={saveCurrentNotes} disabled={isSaving}>
              {isSaving ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
              Save Notes
            </button>
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

      {session && (
        <section className="dashboard">
          <div className="dashboard-header">
            <p className="section-label">Dashboard</p>
            <h2>Saved Notes</h2>
          </div>
          {savedNotes.length === 0 ? (
            <p className="empty-state">No saved notes yet.</p>
          ) : (
            <div className="saved-notes">
              {savedNotes.map((note) => (
                <article className="saved-note" key={note.id}>
                  <div>
                    <h3>{note.file_name}</h3>
                    <p>{note.summary}</p>
                    <span>{new Date(note.created_at).toLocaleString()}</span>
                  </div>
                  <button
                    className="icon-button danger"
                    type="button"
                    onClick={() => deleteSavedNote(note.id)}
                    aria-label="Delete saved note"
                  >
                    <Trash2 size={18} />
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
