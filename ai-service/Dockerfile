FROM python:3.11-slim

WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Download NLTK data (optional, not required)
RUN python -c "import nltk; nltk.download('stopwords', quiet=True)" 2>/dev/null || true

# Pre-train models at build time (dataset mounted via volume or copied)
# Models are trained on first startup if not present

EXPOSE 3001

ENV PYTHONUNBUFFERED=1
ENV PORT=3001

CMD ["python", "app.py"]
