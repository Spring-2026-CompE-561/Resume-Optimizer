FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    UV_LINK_MODE=copy

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY .python-version pyproject.toml uv.lock ./
RUN uv sync --frozen

COPY src ./src
COPY scripts ./scripts
COPY README.md ./README.md

RUN mkdir -p /app/storage/uploads /app/storage/parsed /app/storage/optimized

EXPOSE 8000

CMD ["uv", "run", "--frozen", "uvicorn", "src.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
