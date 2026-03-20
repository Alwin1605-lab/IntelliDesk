#!/bin/sh
# If the volume-mounted models dir is empty, seed it from the baked-in copy.
if [ ! -f /app/models/category_model.pkl ]; then
  echo "[entrypoint] No models in volume — copying pre-trained models..."
  cp -r /app/models_seed/. /app/models/
  echo "[entrypoint] Models ready."
else
  echo "[entrypoint] Pre-trained models found in volume."
fi
exec python app.py
