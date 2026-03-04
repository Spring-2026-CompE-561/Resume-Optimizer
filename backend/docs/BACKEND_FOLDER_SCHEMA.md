# Backend Folder Schema (Modeled After `proffessor-backend`)

This backend structure follows the same core layout pattern as `proffessor-backend`:
- `src/app/core`
- `src/app/models`
- `src/app/schemas`
- `src/app/routes`
- `src/app/api/v1`

It adds project-specific directories for services, middleware, repositories, docs, storage, and Alembic migrations.

## Tree

```text
backend/
├── alembic/
│   └── versions/
│       └── .gitkeep
├── docs/
│   ├── BACKEND_FOLDER_SCHEMA.md
│   └── implementation/
│       ├── .gitkeep
│       ├── ALDEN_CAM_IMPLEMENTATION.md
│       ├── AMARJOT_SANDHU_IMPLEMENTATION.md
│       ├── EREN_UGUR_IMPLEMENTATION.md
│       ├── JOHN_HAYALI_IMPLEMENTATION.md
│       ├── REMINGTON_STEELE_IMPLEMENTATION.md
│       └── TEAM_DEPENDENCIES_AND_ORDER.md
├── scripts/
│   └── .gitkeep
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       └── .gitkeep
│   │   ├── core/
│   │   │   └── .gitkeep
│   │   ├── middleware/
│   │   │   └── .gitkeep
│   │   ├── models/
│   │   │   └── .gitkeep
│   │   ├── repositories/
│   │   │   └── .gitkeep
│   │   ├── routes/
│   │   │   └── .gitkeep
│   │   ├── schemas/
│   │   │   └── .gitkeep
│   │   ├── services/
│   │   │   ├── auth/
│   │   │   │   └── .gitkeep
│   │   │   ├── job_postings/
│   │   │   │   └── .gitkeep
│   │   │   ├── optimize/
│   │   │   │   └── .gitkeep
│   │   │   └── resumes/
│   │   │       └── .gitkeep
│   │   └── utils/
│   │       └── .gitkeep
│   └── test/
│       ├── fixtures/
│       │   └── .gitkeep
│       ├── integration/
│       │   └── .gitkeep
│       └── unit/
│           └── .gitkeep
├── storage/
│   ├── optimized/
│   │   └── .gitkeep
│   ├── parsed/
│   │   └── .gitkeep
│   └── uploads/
│       └── .gitkeep
├── .python-version
├── main.py
├── pyproject.toml
└── README.md
```

## Why This Schema

1. Matches professor layout conventions for discoverability and grading consistency.
2. Separates route layer (`routes`) from business logic (`services`) and persistence (`repositories`).
3. Keeps migration scripts isolated in `alembic/versions`.
4. Keeps binary/text resume artifacts in `storage/*` and out of source packages.
5. Includes `.gitkeep` in empty folders so the intended architecture is visible in Git from day one.

## Folder Responsibilities

- `src/app/core`: settings, database session setup, auth/token primitives.
- `src/app/models`: SQLAlchemy models.
- `src/app/schemas`: Pydantic request/response schemas.
- `src/app/routes`: endpoint definitions.
- `src/app/api/v1`: router composition and version prefixing.
- `src/app/services`: business logic split by domain (`auth`, `resumes`, `job_postings`, `optimize`).
- `src/app/repositories`: DB query layer.
- `src/app/middleware`: request ID, logging, rate limit, and global exception mapping.
- `src/app/utils`: shared helper utilities.
- `src/test`: unit/integration/fixtures.
- `alembic/versions`: migration history.
- `docs/implementation`: task ownership and execution plans.

