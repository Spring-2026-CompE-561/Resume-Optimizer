Resume Optimizer backend built with FastAPI, SQLAlchemy, and Pydantic.

## Features

- JWT-based authentication with register, login, refresh, logout, and password reset flows
- Resume upload, validation, parsing, and per-user CRUD
- Job posting ingestion, scraping, keyword extraction, and per-user CRUD
- Resume optimization pipeline with stored optimization history
- Automatic table creation on startup with SQLAlchemy metadata
- Request logging and CORS configuration
- Unit and integration test coverage with `pytest`

## Project Structure

The backend follows the layout defined in `docs/BACKEND_FOLDER_SCHEMA.md`:

- `src/app/core`: settings, database, auth, and shared dependencies
- `src/app/models`: SQLAlchemy ORM models
- `src/app/schemas`: Pydantic request and response schemas
- `src/app/routes`: FastAPI route modules
- `src/app/api/v1`: versioned router composition
- `src/app/services`: business logic
- `src/app/repository`: database access helpers
- `src/app/exceptions`: shared pre-built `HTTPException` instances
- `src/test`: unit and integration tests
- `storage`: uploaded, parsed, and optimized artifacts

## Setup

### Option 1: `uv` workflow

1. Change into the backend directory:
   - `cd backend`
2. Create and sync the virtual environment:
   - `uv sync`
3. Copy the example environment file:
   - `cp .env.example .env`

### Option 2: standard virtual environment

1. Change into the backend directory:
   - `cd backend`
2. Create a virtual environment:
   - `python3 -m venv .venv`
3. Activate it:
   - `source .venv/bin/activate`
4. Install dependencies:
   - `pip install -r requirements.txt`
5. Copy the example environment file:
   - `cp .env.example .env`

## Running the API

Start the development server from `backend/`:

```bash
uv run uvicorn src.app.main:app --reload
```

If you are using the standard virtual environment flow:

```bash
./.venv/bin/python -m uvicorn src.app.main:app --reload
```

Useful local URLs:

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`
- API health: `http://127.0.0.1:8000/api/v1/health`

## Configuration

Configuration is loaded from `.env` using `pydantic-settings`. See `.env.example` for the full set of supported values.

Important settings:

- `DATABASE_URL`: defaults to a local SQLite database
- `SECRET_KEY`: change this before any non-local deployment
- `CORS_ORIGINS`: JSON array or comma-separated list of allowed origins
- `OPTIMIZE_AI_MODE`: local deterministic mode used for backend-only development and tests

## API Surface

Main route groups:

- `/api/v1/auth`
- `/api/v1/resumes`
- `/api/v1/job-postings`
- `/api/v1/optimize`
- `/api/v1/health`

## Database Notes

- Tables are created automatically on startup with `Base.metadata.create_all(...)`
- No migration framework is used in this project
- The default database file is `backend/resume_optimizer.db`

## Tests and Checks

Run the full test suite:

```bash
./.venv/bin/pytest -q
```

Run the local backend verification script:

```bash
bash scripts/check_backend.sh
```

## Submission Files

- `pyproject.toml`: project metadata and dependency definitions
- `requirements.txt`: exported submission dependency file
- `README.md`: setup and usage guide

## Reference Docs

- `docs/BACKEND_FOLDER_SCHEMA.md`
- `docs/EXCEPTION_PATTERN.md`
- `docs/implementation/TEAM_DEPENDENCIES_AND_ORDER.md`
- `docs/implementation/REMINGTON_STEELE_IMPLEMENTATION.md`
