FROM python:3.11-slim

WORKDIR /app

# Python deps — all packages have manylinux wheels, no compiler needed.
# No apt-get required; avoids flaky Debian mirror issues.
COPY requirements.txt .
RUN pip install --no-cache-dir --timeout=120 --retries=5 -r requirements.txt

# Copy application code
COPY train.py app.py ./

# Bake pre-trained models into the image under a seed directory.
# At runtime, entrypoint.sh copies them into /app/models (the volume mount)
# only if the volume is empty — so re-deploys reuse the persisted volume.
COPY models/ ./models_seed/

# Entrypoint that seeds the volume on first start
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# /app/models is where the app reads models from (may be a Docker volume)
RUN mkdir -p /app/models

EXPOSE 3001

ENV PYTHONUNBUFFERED=1
ENV PORT=3001
ENV DATASET_PATH=/app/dataset

ENTRYPOINT ["./entrypoint.sh"]
