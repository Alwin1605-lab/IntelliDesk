"""
Knowledge Base Semantic Search Module
Uses Sentence-BERT + FAISS for fast similarity search.
Falls back to TF-IDF cosine similarity if models unavailable.
"""
import os
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import logging

logger = logging.getLogger(__name__)

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

# Global state
sbert_model = None
faiss_index = None
articles_store = []  # List of article dicts
article_embeddings = None  # numpy array for SBERT
tfidf_vectorizer = None
tfidf_matrix = None
use_sbert = False


def init_kb_search():
    """Initialize the knowledge base search system."""
    global sbert_model, use_sbert

    # Try loading Sentence-BERT
    try:
        from sentence_transformers import SentenceTransformer
        logger.info("Loading Sentence-BERT model (all-MiniLM-L6-v2)...")
        sbert_model = SentenceTransformer("all-MiniLM-L6-v2")
        use_sbert = True
        logger.info("Sentence-BERT loaded successfully.")
    except Exception as e:
        logger.warning(f"Sentence-BERT failed to load: {e}")
        logger.info("Falling back to TF-IDF similarity search.")
        use_sbert = False


def build_index(articles: list):
    """
    Build search index from articles.
    articles: list of {"id": str, "title": str, "problem": str, "solution": str, "category": str}
    """
    global faiss_index, articles_store, article_embeddings, tfidf_vectorizer, tfidf_matrix

    if not articles:
        logger.warning("No articles provided for indexing.")
        return

    articles_store = articles
    texts = [f"{a['title']} {a['problem']} {a['solution']}" for a in articles]

    # Build SBERT + FAISS index
    if use_sbert and sbert_model:
        try:
            import faiss

            logger.info(f"Building FAISS index for {len(articles)} articles...")
            embeddings = sbert_model.encode(texts, show_progress_bar=False)
            article_embeddings = np.array(embeddings, dtype="float32")

            # Normalize for cosine similarity
            faiss.normalize_L2(article_embeddings)

            # Build FAISS index
            dimension = article_embeddings.shape[1]
            faiss_index = faiss.IndexFlatIP(dimension)  # Inner product = cosine sim on normalized vectors
            faiss_index.add(article_embeddings)

            logger.info(f"FAISS index built with {faiss_index.ntotal} vectors (dim={dimension})")
            return
        except Exception as e:
            logger.warning(f"FAISS index build failed: {e}")

    # Fallback: TF-IDF
    logger.info(f"Building TF-IDF index for {len(articles)} articles...")
    tfidf_vectorizer = TfidfVectorizer(
        max_features=5000,
        ngram_range=(1, 2),
        stop_words="english",
    )
    tfidf_matrix = tfidf_vectorizer.fit_transform(texts)
    logger.info("TF-IDF index built.")


def search(query: str, top_k: int = 3) -> list:
    """
    Search knowledge base for similar articles.
    Returns list of {"title": str, "solution": str, "similarity": float, "articleId": str}
    """
    if not query or not query.strip():
        return []

    if not articles_store:
        return []

    # Try SBERT + FAISS search
    if use_sbert and sbert_model and faiss_index is not None:
        try:
            import faiss

            query_embedding = sbert_model.encode([query])
            query_vec = np.array(query_embedding, dtype="float32")
            faiss.normalize_L2(query_vec)

            scores, indices = faiss_index.search(query_vec, min(top_k, len(articles_store)))

            results = []
            for i, (score, idx) in enumerate(zip(scores[0], indices[0])):
                if idx < 0 or idx >= len(articles_store):
                    continue
                article = articles_store[idx]
                results.append({
                    "title": article["title"],
                    "solution": article["solution"],
                    "similarity": round(float(score), 3),
                    "articleId": article["id"],
                })

            logger.debug(f"FAISS search returned {len(results)} results")
            return results
        except Exception as e:
            logger.warning(f"FAISS search failed: {e}")

    # Fallback: TF-IDF cosine similarity
    if tfidf_vectorizer and tfidf_matrix is not None:
        try:
            query_vec = tfidf_vectorizer.transform([query])
            similarities = cosine_similarity(query_vec, tfidf_matrix)[0]

            # Get top-k indices
            top_indices = np.argsort(similarities)[::-1][:top_k]

            results = []
            for idx in top_indices:
                if similarities[idx] > 0.01:  # Minimum threshold
                    article = articles_store[idx]
                    results.append({
                        "title": article["title"],
                        "solution": article["solution"],
                        "similarity": round(float(similarities[idx]), 3),
                        "articleId": article["id"],
                    })

            logger.debug(f"TF-IDF search returned {len(results)} results")
            return results
        except Exception as e:
            logger.warning(f"TF-IDF search failed: {e}")

    return []
