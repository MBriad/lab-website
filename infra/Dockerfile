FROM python:3.12-slim

WORKDIR /app
COPY backend/requirements.txt /app/backend/requirements.txt
ARG PIP_INDEX_URL=https://pypi.org/simple
RUN pip install --no-cache-dir -i ${PIP_INDEX_URL} -r /app/backend/requirements.txt
COPY backend /app/backend
COPY infra/backend-entrypoint.sh /usr/local/bin/backend-entrypoint
# Normalize line endings: Windows checkouts may carry CRLF, which breaks exec.
RUN sed -i 's/\r$//' /usr/local/bin/backend-entrypoint && chmod +x /usr/local/bin/backend-entrypoint

WORKDIR /app/backend
ENV PYTHONUNBUFFERED=1
EXPOSE 8000
ENTRYPOINT ["/usr/local/bin/backend-entrypoint"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
