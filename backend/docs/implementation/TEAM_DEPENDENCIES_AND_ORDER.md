# Team Dependencies and Execution Order

This document explains how each backend owner connects to the others, what must be built first, and which tasks are blocked until prerequisites are complete.

## Roles

- Alden Cam: Auth + token lifecycle.
- Amarjot Sandhu: Resume ingestion pipeline.
- Eren Ugur: Job posting + scraping + keywords.
- John Hayali: Optimize pipeline.
- Remington Steele: Platform foundation + DB setup + CORS + CI.

## Dependency Graph (High Level)

1. Remington foundation -> unlocks everyone.
2. Alden auth -> required for all protected route testing.
3. Amarjot resumes and Eren job postings -> can run in parallel after 1 and 2.
4. John optimize -> depends on Amarjot + Eren data paths and Alden auth.
5. Remington final integration hardening -> depends on all route implementations.

## What Must Happen First

## Step 1: Platform Baseline (Remington)
- Create app bootstrap (`main.py`) and router wiring (`api/v1/routes.py`).
- Set up `core/database.py` with SQLAlchemy engine, `SessionLocal`, `Base`, and `get_db()`.
- Call `Base.metadata.create_all(bind=engine)` in `main.py` — **no Alembic**.
- Add `CORSMiddleware` — the only middleware layer.
- Share the exception pattern with the team: each domain owner creates `exceptions/<domain>_exceptions.py` with pre-defined `HTTPException` instances (see professor-backend pattern).

Why first:
- Other members need `Base`, `get_db()`, and the exception pattern before they start their domain work.

## Step 2: Auth Core (Alden)
- Implement register/login/me and token utilities in `core/auth.py`.
- Provide `get_current_user` dependency in `core/dependencies.py`.
- Create `exceptions/auth_exceptions.py` with pre-defined `HTTPException` instances.

Why second:
- Resume, job posting, and optimize routes are protected and require `get_current_user` from `core/dependencies.py`.

## Step 3: Domain Pipelines in Parallel (Amarjot + Eren)
- Amarjot: resume upload/parse CRUD — files in `repository/` (singular) and flat `services/`.
- Eren: job posting scrape/keyword CRUD — files in `repository/` (singular) and flat `services/`.

Why parallel:
- Minimal overlap beyond shared auth and base model conventions.
- Both outputs are needed for optimization.

## Step 4: Optimize Pipeline (John)
- Implement optimize endpoint using:
  - parsed resume from Amarjot path
  - job description + keywords from Eren path
  - auth user context from Alden path
- Files in `repository/` (singular) and flat `services/`.

Why fourth:
- Optimize cannot be reliable until upstream resume/job data contracts are stable.

## Step 5: Full Integration + Hardening (Remington + everyone)
- Remington verifies all model files are imported so `create_all` registers all tables.
- Remington finalizes CI gate setup.
- Everyone fixes cross-route inconsistencies found in integration tests.

## Team-to-Team Interfaces

## Alden -> Amarjot/Eren/John
- Provides `get_current_user` dependency from `core/dependencies.py` and token verification from `core/auth.py`.
- Provides `exceptions/auth_exceptions.py` with pre-defined `HTTPException` instances for 401 responses.

## Remington -> Everyone
- Provides `Base`, `engine`, `get_db()` from `core/database.py`.
- Establishes app startup pattern and router registration rules.
- Tables are created automatically on startup — no migration workflow.

## Amarjot + Eren -> John
- Publish stable schema fields for:
  - resume parsed text
  - job description
  - keyword list with scores
- Provide fixture data for optimize integration tests.

## Naming Conventions (Everyone Must Follow)

- Repository folder: **`repository/`** (singular) — not `repositories/`
- Service files: **flat in `services/`** — not nested subdirectories like `services/auth/` or `services/resumes/`
- Exception files: **`exceptions/<domain>_exceptions.py`** with pre-defined `HTTPException` instances — not string error codes

## Merge and Handoff Rules

1. No one merges route code without matching schema and tests.
2. Shared contracts (auth dependency, `Base`, model keys) are reviewed by at least one dependent teammate.
3. John starts final optimize route only after Amarjot + Eren expose stable repository/service interfaces.
4. Remington verifies all model imports are wired into `main.py` before final integration run.

## Blocking Risks and Mitigation

- Risk: model not registered in `create_all` — table missing at startup.
  - Mitigation: each owner imports their model in `main.py` or via a central `models/__init__.py` import.
- Risk: inconsistent exception patterns across domains.
  - Mitigation: Remington shares the professor-backend `HTTPException` pattern at kickoff; each owner follows it before writing routes.
- Risk: optimize contract churn.
  - Mitigation: freeze resume/job repository return shapes before John finalizes prompt builder.

## Minimal Weekly Sequence

1. Day 1-2: Remington baseline + Alden auth start.
2. Day 3-5: Amarjot and Eren build and test domain routes.
3. Day 6-7: John optimize integration with fixture data.
4. Final 2 days: system integration, bug fixing, and test hardening across team.
