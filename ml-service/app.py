"""
TicketIQ ML Microservice
Flask API for ticket classification, priority prediction, and knowledge base search.
"""
import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ticketiq-ml")

app = Flask(__name__)
CORS(app)

# ---- Initialize models on startup ----

logger.info("=" * 50)
logger.info("  TicketIQ ML Service - Initializing...")
logger.info("=" * 50)

from models.classifier import init_classifier, classify
from models.priority import init_priority_model, predict_priority
from models.kb_search import init_kb_search, build_index, search

# Initialize models
init_classifier()
init_priority_model()
init_kb_search()

logger.info("All models initialized.")
logger.info("=" * 50)


# ---- API Endpoints ----

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "TicketIQ ML Service",
        "models": {
            "classifier": "loaded",
            "priority": "loaded",
            "kb_search": "loaded",
        }
    })


@app.route("/classify", methods=["POST"])
def classify_ticket():
    """Classify ticket text into a category."""
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "Missing 'text' field"}), 400

    text = data["text"]
    result = classify(text)

    logger.info(f"Classified: '{text[:80]}...' -> {result['category']} ({result['confidence']:.2f})")
    return jsonify(result)


@app.route("/priority", methods=["POST"])
def predict_ticket_priority():
    """Predict ticket priority."""
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "Missing 'text' field"}), 400

    text = data["text"]
    category = data.get("category", "")
    result = predict_priority(text, category)

    logger.info(f"Priority: '{text[:80]}...' -> {result['priority']} ({result['score']:.2f})")
    return jsonify(result)


@app.route("/recommend", methods=["POST"])
def recommend_articles():
    """Search knowledge base for similar articles."""
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "Missing 'text' field"}), 400

    text = data["text"]
    top_k = data.get("top_k", 3)
    results = search(text, top_k=top_k)

    logger.info(f"KB search: '{text[:80]}...' -> {len(results)} results")
    return jsonify({"suggestions": results})


@app.route("/index/rebuild", methods=["POST"])
def rebuild_faiss_index():
    """Rebuild the FAISS index from provided articles."""
    data = request.get_json()
    if not data or "articles" not in data:
        return jsonify({"error": "Missing 'articles' field"}), 400

    articles = data["articles"]
    build_index(articles)

    return jsonify({
        "success": True,
        "message": f"Index rebuilt with {len(articles)} articles",
    })


# ---- Error Handlers ----

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(500)
def internal_error(e):
    logger.error(f"Internal error: {e}")
    return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("ML_PORT", 5001))
    logger.info(f"Starting ML service on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)
