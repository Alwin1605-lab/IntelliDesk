"""
Priority Prediction Module
Uses XGBoost with TF-IDF features, falls back to rule-based priority.
"""
import json
import os
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
import joblib
import logging

logger = logging.getLogger(__name__)

PRIORITIES = ["Low", "Medium", "High", "Critical"]
MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
PRIORITY_MODEL_PATH = os.path.join(MODEL_DIR, "priority_model.joblib")
TRAINING_DATA_PATH = os.path.join(MODEL_DIR, "training_data.json")

# Global model references
xgb_model = None
tfidf_vectorizer = None
label_encoder = None
use_xgb = False


def _load_training_data():
    """Load training data."""
    with open(TRAINING_DATA_PATH, "r") as f:
        data = json.load(f)
    texts = [item["text"] for item in data]
    priorities = [item["priority"] for item in data]
    categories = [item["category"] for item in data]
    return texts, priorities, categories


def _extract_features(text: str) -> dict:
    """Extract hand-crafted features for priority prediction."""
    lower = text.lower()
    word_count = len(lower.split())

    critical_keywords = [
        "down", "outage", "breach", "ransomware", "emergency", "critical",
        "production", "all users", "data loss", "compromised", "unresponsive",
        "server down", "complete failure",
    ]
    high_keywords = [
        "urgent", "important", "asap", "cannot work", "blocking", "deadline",
        "multiple users", "failing", "broken", "expired", "security",
        "unauthorized", "cannot log in", "locked out",
    ]
    low_keywords = [
        "request", "nice to have", "when possible", "low priority", "minor",
        "cosmetic", "question", "information", "new employee", "setup",
    ]

    critical_count = sum(1 for kw in critical_keywords if kw in lower)
    high_count = sum(1 for kw in high_keywords if kw in lower)
    low_count = sum(1 for kw in low_keywords if kw in lower)

    has_exclamation = "!" in text
    has_caps_words = sum(1 for w in text.split() if w.isupper() and len(w) > 2)

    return {
        "word_count": word_count,
        "critical_signals": critical_count,
        "high_signals": high_count,
        "low_signals": low_count,
        "has_exclamation": int(has_exclamation),
        "caps_words": has_caps_words,
    }


def _build_xgb_model():
    """Train an XGBoost model for priority prediction."""
    global xgb_model, tfidf_vectorizer, label_encoder, use_xgb

    try:
        import xgboost as xgb
    except ImportError:
        logger.warning("XGBoost not available. Using rule-based priority.")
        use_xgb = False
        return

    logger.info("Training XGBoost priority model...")

    texts, priorities, categories = _load_training_data()

    # TF-IDF features
    tfidf_vectorizer = TfidfVectorizer(
        max_features=2000,
        ngram_range=(1, 2),
        stop_words="english",
    )
    tfidf_features = tfidf_vectorizer.fit_transform(texts).toarray()

    # Hand-crafted features
    handcrafted = np.array([
        list(_extract_features(t).values()) for t in texts
    ])

    # Combine features
    X = np.hstack([tfidf_features, handcrafted])

    # Encode labels
    label_encoder = LabelEncoder()
    label_encoder.classes_ = np.array(PRIORITIES)
    y = label_encoder.transform(priorities)

    # Train XGBoost
    model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        objective="multi:softprob",
        num_class=len(PRIORITIES),
        use_label_encoder=False,
        eval_metric="mlogloss",
        random_state=42,
    )
    model.fit(X, y)

    xgb_model = model
    use_xgb = True

    # Save model
    joblib.dump({
        "model": model,
        "tfidf": tfidf_vectorizer,
        "encoder": label_encoder,
    }, PRIORITY_MODEL_PATH)

    logger.info("XGBoost priority model trained and saved.")


def _load_xgb_model():
    """Load saved XGBoost model or train new one."""
    global xgb_model, tfidf_vectorizer, label_encoder, use_xgb

    if os.path.exists(PRIORITY_MODEL_PATH):
        try:
            saved = joblib.load(PRIORITY_MODEL_PATH)
            xgb_model = saved["model"]
            tfidf_vectorizer = saved["tfidf"]
            label_encoder = saved["encoder"]
            use_xgb = True
            logger.info("XGBoost model loaded from disk.")
            return
        except Exception as e:
            logger.warning(f"Failed to load saved XGBoost model: {e}")

    _build_xgb_model()


def init_priority_model():
    """Initialize the priority prediction model."""
    try:
        _load_xgb_model()
    except Exception as e:
        logger.warning(f"XGBoost init failed: {e}. Using rule-based priority.")
        use_xgb = False


def predict_priority(text: str, category: str = "") -> dict:
    """
    Predict ticket priority.
    Returns: {"priority": str, "score": float}
    """
    if not text or not text.strip():
        return {"priority": "Medium", "score": 0.5}

    # Try XGBoost
    if use_xgb and xgb_model and tfidf_vectorizer and label_encoder:
        try:
            tfidf_feat = tfidf_vectorizer.transform([text]).toarray()
            hand_feat = np.array([list(_extract_features(text).values())])
            X = np.hstack([tfidf_feat, hand_feat])

            probas = xgb_model.predict_proba(X)[0]
            pred_idx = int(np.argmax(probas))
            priority = label_encoder.inverse_transform([pred_idx])[0]
            score = float(probas[pred_idx])

            logger.debug(f"XGBoost priority: {priority} ({score:.2f})")
            return {"priority": priority, "score": round(score, 3)}
        except Exception as e:
            logger.warning(f"XGBoost prediction failed: {e}")

    # Fallback: rule-based
    return _rule_based_priority(text)


def _rule_based_priority(text: str) -> dict:
    """Rule-based priority prediction."""
    features = _extract_features(text)

    if features["critical_signals"] >= 2:
        return {"priority": "Critical", "score": 0.95}
    if features["critical_signals"] >= 1:
        return {"priority": "Critical", "score": 0.85}
    if features["high_signals"] >= 2:
        return {"priority": "High", "score": 0.8}
    if features["high_signals"] >= 1:
        return {"priority": "High", "score": 0.7}
    if features["low_signals"] >= 1:
        return {"priority": "Low", "score": 0.65}

    # Default medium
    score = 0.5
    if features["has_exclamation"]:
        score += 0.1
    if features["caps_words"] > 2:
        score += 0.1
    if features["word_count"] > 50:
        score += 0.05

    return {"priority": "Medium", "score": round(min(score, 0.95), 3)}
