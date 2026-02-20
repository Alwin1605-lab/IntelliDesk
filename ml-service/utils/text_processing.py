import re
import string


def clean_text(text: str) -> str:
    """Clean and normalize text for NLP processing."""
    if not text:
        return ""
    # Lowercase
    text = text.lower()
    # Remove URLs
    text = re.sub(r"http\S+|www\.\S+", "", text)
    # Remove email addresses
    text = re.sub(r"\S+@\S+\.\S+", "", text)
    # Remove special characters but keep spaces and basic punctuation
    text = re.sub(r"[^\w\s.,!?-]", " ", text)
    # Remove extra whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text


def extract_keywords(text: str) -> list:
    """Extract important keywords from text."""
    stop_words = {
        "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you",
        "your", "yours", "yourself", "he", "him", "his", "she", "her", "it",
        "its", "they", "them", "their", "a", "an", "the", "and", "but", "or",
        "for", "nor", "not", "so", "yet", "to", "of", "in", "on", "at", "by",
        "with", "from", "as", "is", "was", "are", "were", "be", "been",
        "being", "have", "has", "had", "do", "does", "did", "will", "would",
        "could", "should", "may", "might", "can", "this", "that", "these",
        "those", "am", "into", "through", "during", "before", "after",
        "above", "below", "up", "down", "out", "off", "over", "under",
        "again", "further", "then", "once", "here", "there", "when", "where",
        "why", "how", "all", "each", "every", "both", "few", "more", "most",
        "other", "some", "such", "no", "only", "own", "same", "than", "too",
        "very", "just", "because", "about"
    }

    words = clean_text(text).split()
    keywords = [w for w in words if w not in stop_words and len(w) > 2]
    return keywords
