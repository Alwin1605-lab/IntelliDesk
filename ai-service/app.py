import os
import re
import json
import logging
import numpy as np
import pandas as pd
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.metrics.pairwise import cosine_similarity
import joblib

from train import (
    clean_text,
    CATEGORY_MAP,
    PRIORITY_RULES,
    TEAM_MAP,
    SLA_HOURS,
    AI_SUGGESTIONS,
    MODELS_DIR,
    train_all,
)

# ─────────────────────────────────────────────────────────────
# APP SETUP
# ─────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# ─────────────────────────────────────────────────────────────
# LOAD MODELS
# ─────────────────────────────────────────────────────────────
cat_model = None
prio_model = None
sim_vectorizer = None
sim_matrix = None
sim_corpus = None
metadata = {}


def load_models():
    global cat_model, prio_model, sim_vectorizer, sim_matrix, sim_corpus, metadata

    cat_path = MODELS_DIR / "category_model.pkl"
    prio_path = MODELS_DIR / "priority_model.pkl"

    if not cat_path.exists() or not prio_path.exists():
        logger.info("Models not found — training now...")
        metadata = train_all()
    else:
        logger.info("Loading pre-trained models...")

    cat_model = joblib.load(MODELS_DIR / "category_model.pkl")
    prio_model = joblib.load(MODELS_DIR / "priority_model.pkl")

    sim_vect_path = MODELS_DIR / "sim_vectorizer.pkl"
    sim_mat_path = MODELS_DIR / "sim_matrix.pkl"
    sim_corpus_path = MODELS_DIR / "sim_corpus.json"

    if sim_vect_path.exists():
        sim_vectorizer = joblib.load(sim_vect_path)
        sim_matrix = joblib.load(sim_mat_path)
        with open(sim_corpus_path) as f:
            sim_corpus = json.load(f)

    meta_path = MODELS_DIR / "metadata.json"
    if meta_path.exists():
        with open(meta_path) as f:
            metadata = json.load(f)

    logger.info(
        f"Models loaded. Category acc: {metadata.get('category_accuracy', 'N/A')}"
    )


# ─────────────────────────────────────────────────────────────
# HELPER FUNCTIONS
# ─────────────────────────────────────────────────────────────
def predict_category(text):
    cleaned = clean_text(text)
    proba = cat_model.predict_proba([cleaned])[0]
    classes = cat_model.classes_
    idx = int(np.argmax(proba))
    return classes[idx], float(proba[idx]), dict(zip(classes, proba.tolist()))


def predict_priority(text):
    cleaned = clean_text(text)
    proba = prio_model.predict_proba([cleaned])[0]
    classes = prio_model.classes_
    idx = int(np.argmax(proba))
    return classes[idx], float(proba[idx])


def get_similar_tickets(text, top_k=5):
    if sim_vectorizer is None or sim_matrix is None or sim_corpus is None:
        return []
    cleaned = clean_text(text)
    vec = sim_vectorizer.transform([cleaned])
    scores = cosine_similarity(vec, sim_matrix)[0]
    top_indices = np.argsort(scores)[::-1][:top_k]
    results = []
    for i in top_indices:
        score = float(scores[i])
        if score < 0.15:
            continue
        rec = sim_corpus[i]
        results.append(
            {
                "similarity": round(score, 3),
                "category": rec.get("category", ""),
                "priority": rec.get("priority", ""),
                "subject": rec.get("subject", rec.get("text", "")[:100]),
                "solution": rec.get("answer", ""),
            }
        )
    return results


def rule_based_category_boost(text, predicted_cat, predicted_proba):
    """Boost prediction using explicit keyword matching when confidence is low."""
    if predicted_proba > 0.6:
        return predicted_cat, predicted_proba

    text_lower = text.lower()
    scores = {}
    for cat, keywords in CATEGORY_MAP.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        if score > 0:
            scores[cat] = score

    if scores:
        best_rule = max(scores, key=scores.get)
        # Blend: rule beats model only if score >= 2 and confidence < 0.5
        if scores[best_rule] >= 2 and predicted_proba < 0.5:
            return best_rule, min(0.7, predicted_proba + 0.2)

    return predicted_cat, predicted_proba


def estimate_resolution_time(priority):
    hours = SLA_HOURS.get(priority, 24)
    if hours < 2:
        return f"{hours} hour"
    if hours < 24:
        return f"{hours} hours"
    return f"{hours // 24} day{'s' if hours > 24 else ''}"


# ─────────────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify(
        {
            "status": "ok",
            "models_loaded": cat_model is not None,
            "category_accuracy": metadata.get("category_accuracy"),
            "priority_accuracy": metadata.get("priority_accuracy"),
        }
    )


@app.route("/classify", methods=["POST"])
def classify():
    """
    MODULE 1 + 2 + 3: Classify ticket → category, priority, assigned team, SLA
    """
    body = request.get_json(force=True)
    title = body.get("title", "")
    description = body.get("description", "")
    text = f"{title} {description}"

    if not text.strip():
        return jsonify({"error": "text is required"}), 400

    category, cat_conf, all_proba = predict_category(text)
    category, cat_conf = rule_based_category_boost(text, category, cat_conf)

    priority, prio_conf = predict_priority(text)

    # Keyword rule for priority boost (critical keywords)
    text_lower = text.lower()
    for prio, keywords in PRIORITY_RULES.items():
        for kw in keywords:
            if kw in text_lower:
                if prio == "critical" and priority != "critical":
                    priority = "critical"
                    prio_conf = max(prio_conf, 0.7)
                break

    assigned_team = TEAM_MAP.get(category, TEAM_MAP["other"])
    sla_hours = SLA_HOURS.get(priority, 24)
    suggestions = AI_SUGGESTIONS.get(category, AI_SUGGESTIONS["other"])
    similar = get_similar_tickets(text, top_k=3)

    return jsonify(
        {
            "category": category,
            "confidence": round(cat_conf, 3),
            "priority": priority,
            "priorityConfidence": round(prio_conf, 3),
            "assignedTeam": assigned_team,
            "slaHours": sla_hours,
            "estimatedResolution": estimate_resolution_time(priority),
            "aiSuggestions": suggestions,
            "similarTickets": similar,
            "categoryProbabilities": {k: round(v, 3) for k, v in all_proba.items()},
        }
    )


@app.route("/suggest-solution", methods=["POST"])
def suggest_solution():
    """MODULE 4: Auto solution suggestion."""
    body = request.get_json(force=True)
    category = body.get("category", "other")
    title = body.get("title", "")
    description = body.get("description", "")
    text = f"{title} {description}"

    suggestions = AI_SUGGESTIONS.get(category, AI_SUGGESTIONS["other"])
    similar = get_similar_tickets(text, top_k=5) if text.strip() else []

    return jsonify(
        {
            "suggestions": suggestions,
            "similarTickets": similar,
            "category": category,
        }
    )


@app.route("/similar-tickets", methods=["POST"])
def similar_tickets():
    """MODULE 5: Find similar resolved tickets."""
    body = request.get_json(force=True)
    title = body.get("title", "")
    description = body.get("description", "")
    text = f"{title} {description}"
    top_k = int(body.get("topK", 5))

    if not text.strip():
        return jsonify({"results": []})

    results = get_similar_tickets(text, top_k=top_k)
    return jsonify({"results": results, "count": len(results)})


@app.route("/predict-priority", methods=["POST"])
def predict_priority_route():
    """Standalone priority prediction."""
    body = request.get_json(force=True)
    text = body.get("text", "")
    if not text.strip():
        return jsonify({"error": "text required"}), 400
    priority, conf = predict_priority(text)
    return jsonify(
        {
            "priority": priority,
            "confidence": round(conf, 3),
            "slaHours": SLA_HOURS.get(priority, 24),
            "estimatedResolution": estimate_resolution_time(priority),
        }
    )


@app.route("/root-cause", methods=["POST"])
def root_cause():
    """MODULE ADVANCED: Root cause detection from repeated issue pattern."""
    body = request.get_json(force=True)
    tickets = body.get("tickets", [])  # list of {title, description, category}

    if not tickets:
        return jsonify({"rootCauses": [], "recommendation": "No data to analyze"})

    # Count category frequency
    from collections import Counter

    cats = [t.get("category", "other") for t in tickets]
    cat_counts = Counter(cats)
    dominant = cat_counts.most_common(1)[0]

    # Extract common keywords
    all_text = " ".join(
        [f"{t.get('title', '')} {t.get('description', '')}" for t in tickets]
    )
    cleaned = clean_text(all_text)
    words = cleaned.split()
    word_counts = Counter(words)
    # Remove stop words
    stopwords = {
        "the",
        "a",
        "an",
        "is",
        "are",
        "was",
        "were",
        "to",
        "of",
        "and",
        "or",
        "in",
        "on",
        "at",
        "for",
        "with",
        "from",
        "by",
        "this",
        "that",
        "it",
        "have",
        "has",
        "been",
        "be",
        "not",
        "my",
        "your",
        "our",
        "their",
        "i",
        "we",
        "you",
        "he",
        "she",
        "they",
        "do",
        "did",
        "can",
        "could",
        "would",
    }
    keywords = [
        (w, c)
        for w, c in word_counts.most_common(20)
        if w not in stopwords and len(w) > 3
    ]

    root_causes = []
    if dominant[1] >= 3:
        root_causes.append(
            {
                "category": dominant[0],
                "occurrences": dominant[1],
                "likelihood": "HIGH" if dominant[1] >= 5 else "MEDIUM",
                "commonKeywords": [k[0] for k in keywords[:5]],
            }
        )

    recommendation = ""
    if dominant[0] == "hardware" and dominant[1] >= 3:
        recommendation = "Recurring hardware failures detected. Consider proactive hardware inspection or replacement."
    elif dominant[0] == "network" and dominant[1] >= 3:
        recommendation = "Network instability pattern detected. Review network infrastructure and consider redundancy."
    elif dominant[0] == "software" and dominant[1] >= 3:
        recommendation = "Repeated software issues. Consider software audit, patch management review."
    elif dominant[0] == "security" and dominant[1] >= 2:
        recommendation = "CRITICAL: Multiple security incidents. Initiate full security audit immediately."
    else:
        recommendation = (
            f"Monitor {dominant[0]} issues. Consider preventive maintenance."
        )

    return jsonify(
        {
            "rootCauses": root_causes,
            "recommendation": recommendation,
            "dominantCategory": dominant[0],
            "totalTicketsAnalyzed": len(tickets),
        }
    )


@app.route("/sla-prediction", methods=["POST"])
def sla_prediction():
    """MODULE ADVANCED: Predict SLA breach risk."""
    body = request.get_json(force=True)
    priority = body.get("priority", "medium")
    created_at = body.get("createdAt")
    current_time = body.get("currentTime")

    sla_hours = SLA_HOURS.get(priority, 24)

    import datetime

    risk = "low"
    hours_elapsed = 0

    if created_at and current_time:
        try:
            from datetime import datetime as dt

            created = dt.fromisoformat(created_at.replace("Z", "+00:00"))
            current = dt.fromisoformat(current_time.replace("Z", "+00:00"))
            hours_elapsed = (current - created).total_seconds() / 3600
            pct_used = hours_elapsed / sla_hours
            if pct_used >= 1.0:
                risk = "breached"
            elif pct_used >= 0.75:
                risk = "high"
            elif pct_used >= 0.5:
                risk = "medium"
            else:
                risk = "low"
        except Exception as e:
            logger.warning(f"SLA prediction date parse error: {e}")

    return jsonify(
        {
            "priority": priority,
            "slaHours": sla_hours,
            "hoursElapsed": round(hours_elapsed, 2),
            "hoursRemaining": max(0, round(sla_hours - hours_elapsed, 2)),
            "breachRisk": risk,
            "shouldEscalate": risk in ["high", "breached"],
        }
    )


@app.route("/chatbot", methods=["POST"])
def chatbot():
    """MODULE ADVANCED: Chatbot response with AI classification."""
    body = request.get_json(force=True)
    message = body.get("message", "")

    if not message.strip():
        return jsonify(
            {"response": "Please describe your issue.", "suggestTicket": False}
        )

    text_lower = message.lower()

    # Greetings
    if any(g in text_lower for g in ["hello", "hi", "hey", "greetings"]):
        return jsonify(
            {
                "response": "Hello! I'm your IT Support Assistant. How can I help you today?",
                "suggestTicket": False,
            }
        )

    # Password reset
    if "password" in text_lower and any(
        w in text_lower for w in ["reset", "forgot", "change", "expired"]
    ):
        return jsonify(
            {
                "response": "For password reset:\n1. Go to login page and click 'Forgot Password'\n2. Enter your email address\n3. Check your email for reset link\n4. If account is locked, contact IT helpdesk\n\nWould you like me to create a ticket for this?",
                "category": "authentication",
                "suggestTicket": False,
            }
        )

    # Classify the message
    category, cat_conf, _ = predict_category(message)
    category, cat_conf = rule_based_category_boost(message, category, cat_conf)
    suggestions = AI_SUGGESTIONS.get(category, AI_SUGGESTIONS["other"])

    response = (
        f"I understand you're having a {category} issue. Here are some quick steps:\n\n"
    )
    for i, step in enumerate(suggestions[:4], 1):
        response += f"{i}. {step}\n"
    response += (
        "\nIf these steps don't resolve your issue, I can create a support ticket."
    )

    return jsonify(
        {
            "response": response,
            "category": category,
            "confidence": round(cat_conf, 3),
            "suggestions": suggestions,
            "suggestTicket": cat_conf > 0.3,
        }
    )


@app.route("/retrain", methods=["POST"])
def retrain():
    """Retrain models (admin only, called with secret key)."""
    body = request.get_json(force=True)
    secret = body.get("secret", "")
    if secret != os.environ.get("RETRAIN_SECRET", "retrain-secret-2024"):
        return jsonify({"error": "Unauthorized"}), 401

    try:
        meta = train_all()
        load_models()
        return jsonify({"success": True, "metadata": meta})
    except Exception as e:
        logger.error(f"Retrain failed: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/metadata", methods=["GET"])
def get_metadata():
    return jsonify(metadata)


# ─────────────────────────────────────────────────────────────
# STARTUP
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    load_models()
    port = int(os.environ.get("PORT", 3001))
    app.run(host="0.0.0.0", port=port, debug=False)
