FROM node:22-bookworm-slim AS frontend
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim-bookworm AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 ATLAS_ENVIRONMENT=production ATLAS_DATA_DIR=/var/lib/atlas PORT=8000
WORKDIR /app
COPY backend/requirements.lock /app/requirements.lock
RUN pip install --no-cache-dir -r /app/requirements.lock && useradd --create-home --uid 10001 atlas && mkdir -p /var/lib/atlas && chown atlas:atlas /var/lib/atlas && chmod 700 /var/lib/atlas
COPY backend/app/ /app/backend/app/
COPY --from=frontend /build/dist/ /app/frontend/dist/
USER atlas
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=4s --start-period=15s CMD python -c "import os,urllib.request;urllib.request.urlopen('http://127.0.0.1:'+os.getenv('PORT','8000')+'/api/v1/health',timeout=3)"
CMD ["sh", "-c", "exec python -m uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --no-access-log"]
