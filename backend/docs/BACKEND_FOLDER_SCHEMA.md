# Backend Folder Schema (Modeled After `proffessor-backend`)

This backend structure follows the same core layout pattern as `proffessor-backend`:
- `src/app/core`
- `src/app/models`
- `src/app/schemas`
- `src/app/routes`
- `src/app/api/v1`

It adds project-specific directories for services, exceptions, repository, docs, and storage.

## Tree

```text
backend/
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
│   │   ├── exceptions/
│   │   │   └── .gitkeep
│   │   ├── models/
│   │   │   └── .gitkeep
│   │   ├── repository/
│   │   │   └── .gitkeep
│   │   ├── routes/
│   │   │   └── .gitkeep
│   │   ├── schemas/
│   │   │   └── .gitkeep
│   │   ├── services/
│   │   │   └── .gitkeep
│   │   └── main.py
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
├── pyproject.toml
└── README.md
```

## Why This Schema

1. Matches professor layout conventions for discoverability and grading consistency.
2. Separates route layer (`routes`) from business logic (`services`) and persistence (`repository`).
3. Uses `Base.metadata.create_all()` for table creation — no migration tooling needed.
4. Keeps binary/text resume artifacts in `storage/*` and out of source packages.
5. Includes `.gitkeep` in empty folders so the intended architecture is visible in Git from day one.

## Folder Responsibilities

- `src/app/core`: settings, database session setup, auth/token primitives, and shared dependencies.
- `src/app/models`: SQLAlchemy models.
- `src/app/schemas`: Pydantic request/response schemas.
- `src/app/routes`: endpoint definitions.
- `src/app/api/v1`: router composition and version prefixing.
- `src/app/services`: business logic (flat — one file per domain, e.g. `auth_service.py`, `scrape_service.py`).
- `src/app/repository`: DB query layer (flat — one file per domain, e.g. `auth_repository.py`).
- `src/app/exceptions`: pre-defined `HTTPException` instances grouped by domain (e.g. `auth_exceptions.py`).
- `src/test`: unit/integration/fixtures.
- `docs/implementation`: task ownership and execution plans.
