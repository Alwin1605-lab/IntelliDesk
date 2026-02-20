"""
Ticket Classification Module
Uses HuggingFace zero-shot classification with DistilBERT fallback to TF-IDF + custom classifier.
"""
import json
import os
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
import joblib
import logging

logger = logging.getLogger(__name__)

CATEGORIES = ["Network", "Hardware", "Software", "Security", "Access"]
MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
CUSTOM_MODEL_PATH = os.path.join(MODEL_DIR, "classifier_model.joblib")
TRAINING_DATA_PATH = os.path.join(MODEL_DIR, "training_data.json")

# Global model references
hf_classifier = None
custom_classifier = None
use_hf = False


def _load_training_data():
    """Load training data from JSON file."""
    with open(TRAINING_DATA_PATH, "r") as f:
        data = json.load(f)
    texts = [item["text"] for item in data]
    labels = [item["category"] for item in data]
    return texts, labels


def _build_custom_classifier():
    """Build and train a TF-IDF + Logistic Regression classifier."""
    global custom_classifier
    logger.info("Building custom TF-IDF classifier...")

    texts, labels = _load_training_data()

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            max_features=5000,
            ngram_range=(1, 2),
            stop_words="english",
            sublinear_tf=True,
        )),
        ("clf", LogisticRegression(
            max_iter=1000,
            C=10.0,
            class_weight="balanced",
            multi_class="multinomial",
            solver="lbfgs",
        )),
    ])

    pipeline.fit(texts, labels)
    custom_classifier = pipeline

    # Save for faster reloads
    joblib.dump(pipeline, CUSTOM_MODEL_PATH)
    logger.info("Custom classifier trained and saved.")


def _load_custom_classifier():
    """Load the custom classifier from disk or train new one."""
    global custom_classifier
    if os.path.exists(CUSTOM_MODEL_PATH):
        try:
            custom_classifier = joblib.load(CUSTOM_MODEL_PATH)
            logger.info("Custom classifier loaded from disk.")
            return
        except Exception as e:
            logger.warning(f"Failed to load saved classifier: {e}")

    _build_custom_classifier()


def init_classifier():
    """Initialize the classification model. Try HuggingFace first, fall back to custom."""
    global hf_classifier, use_hf

    # Try to load HuggingFace zero-shot classifier
    try:
        from transformers import pipeline
        logger.info("Loading HuggingFace zero-shot classification pipeline...")
        hf_classifier = pipeline(
            "zero-shot-classification",
            model="distilbert-base-uncased-mnli",
            device=-1,  # CPU
        )
        use_hf = True
        logger.info("HuggingFace classifier loaded successfully.")
    except Exception as e:
        logger.warning(f"HuggingFace model failed to load: {e}")
        logger.info("Falling back to custom TF-IDF classifier.")
        use_hf = False

    # Always build custom classifier as backup
    _load_custom_classifier()


def classify(text: str) -> dict:
    """
    Classify ticket text into a category.
    Returns: {"category": str, "confidence": float}
    """
    if not text or not text.strip():
        return {"category": "Other", "confidence": 0.0}

    # Try HuggingFace first
    if use_hf and hf_classifier:
        try:
            result = hf_classifier(
                text,
                candidate_labels=CATEGORIES,
                hypothesis_template="This IT support ticket is about {}.",
            )
            category = result["labels"][0]
            confidence = float(result["scores"][0])
            logger.debug(f"HF classified: {category} ({confidence:.2f})")
            return {"category": category, "confidence": round(confidence, 3)}
        except Exception as e:
            logger.warning(f"HF classification failed: {e}, using fallback")

    # Fallback: custom classifier
    if custom_classifier:
        try:
            prediction = custom_classifier.predict([text])[0]
            probas = custom_classifier.predict_proba([text])[0]
            confidence = float(max(probas))
            logger.debug(f"Custom classified: {prediction} ({confidence:.2f})")
            return {"category": prediction, "confidence": round(confidence, 3)}
        except Exception as e:
            logger.warning(f"Custom classification failed: {e}")

    # Last resort: keyword matching
    return _keyword_classify(text)


def _keyword_classify(text: str) -> dict:
    """Keyword-based classification as absolute last resort."""
    lower = text.lower()
    rules = {
        "Network": ["network", "internet", "wifi", "vpn", "dns", "firewall", "router", "bandwidth", "connectivity", "lan"],
        "Hardware": ["hardware", "printer", "monitor", "keyboard", "mouse", "laptop", "screen", "battery", "usb", "dock", "webcam"],
        "Security": ["security", "virus", "malware", "phishing", "breach", "hack", "ransomware", "suspicious", "threat", "antivirus"],
        "Access": ["access", "permission", "login", "password", "reset", "account", "locked", "mfa", "credentials", "sso"],
        "Software": ["software", "install", "update", "crash", "error", "application", "app", "outlook", "excel", "teams", "license"],
    }

    best_cat = "Other"
    best_score = 0
    for category, keywords in rules.items():
        score = sum(1 for kw in keywords if kw in lower)
        if score > best_score:
            best_cat = category
            best_score = score

    confidence = min(0.3 + best_score * 0.1, 0.8) if best_score > 0 else 0.1
    return {"category": best_cat, "confidence": round(confidence, 3)}
