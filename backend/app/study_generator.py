import re
from collections import Counter


STOP_WORDS = {
    "about",
    "after",
    "again",
    "also",
    "because",
    "between",
    "could",
    "during",
    "each",
    "from",
    "have",
    "into",
    "more",
    "other",
    "should",
    "some",
    "such",
    "than",
    "that",
    "their",
    "then",
    "there",
    "these",
    "they",
    "this",
    "through",
    "using",
    "when",
    "where",
    "which",
    "with",
    "would",
}


def split_sentences(text: str) -> list[str]:
    sentences = re.split(r"(?<=[.!?])\s+", text.replace("\n", " "))
    return [sentence.strip() for sentence in sentences if len(sentence.strip()) > 40]


def find_keywords(text: str, limit: int = 8) -> list[str]:
    words = re.findall(r"\b[a-zA-Z][a-zA-Z]{4,}\b", text.lower())
    useful_words = [word for word in words if word not in STOP_WORDS]
    counts = Counter(useful_words)
    return [word for word, _ in counts.most_common(limit)]


def generate_study_material(text: str) -> dict:
    sentences = split_sentences(text)
    keywords = find_keywords(text)

    summary = " ".join(sentences[:3])
    if not summary:
        summary = "The uploaded PDF text was too short to create a strong summary."

    key_points = sentences[:5]
    if not key_points:
        key_points = ["Review the extracted text and identify the main lecture concepts."]

    flashcards = [
        {
            "front": f"What is the meaning of {keyword} in this lecture?",
            "back": "Check the extracted lecture text and write the meaning in your own words.",
        }
        for keyword in keywords[:5]
    ]

    quiz = [
        {
            "question": f"Explain the role of {keyword} in this topic.",
            "answer": "Use the lecture text to answer with one clear example.",
            "topic": keyword,
        }
        for keyword in keywords[:5]
    ]

    revision_plan = [
        "Read the summary once to understand the lecture direction.",
        "Study the key points and mark difficult terms.",
        "Try the quiz without looking at the notes.",
        "Revise weak quiz topics again after 24 hours.",
    ]

    return {
        "summary": summary,
        "key_points": key_points,
        "flashcards": flashcards,
        "quiz": quiz,
        "revision_plan": revision_plan,
    }
