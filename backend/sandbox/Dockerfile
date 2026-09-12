FROM python:3.11-slim

RUN pip install --no-cache-dir \
    pytest \
    fastapi \
    "uvicorn[standard]" \
    sqlalchemy \
    "psycopg[binary]" \
    pydantic-settings \
    httpx

WORKDIR /workspace

CMD ["pytest", "-q"]
