# Amarjot Sandhu Backend Implementation Plan

## Ownership
- Primary domain: Resume ingestion and resume CRUD.
- Route ownership:
  - `POST /api/v1/resumes`
  - `GET /api/v1/resumes`
  - `GET /api/v1/resumes/{id}`
  - `DELETE /api/v1/resumes/{id}`

## Files to Create

```text
backend/src/app/routes/resumes.py
backend/src/app/schemas/resume.py
backend/src/app/models/resume.py
backend/src/app/models/resume_skill.py
backend/src/app/repository/resume_repository.py
backend/src/app/services/resume_upload_service.py
backend/src/app/services/resume_parse_service.py
backend/src/app/services/resume_skill_service.py
backend/src/app/exceptions/resume_exceptions.py
backend/src/test/unit/test_resume_parse_service.py
backend/src/test/integration/test_resume_routes.py
```

## Implementation Detail

## 1) Upload + Validation Pipeline
- Accept multipart file under `file`.
- Enforce allowed MIME types:
  - `application/pdf`
  - DOCX MIME
- Enforce max size (for example 5 MB).
- Store original file in `backend/storage/uploads`.

## 2) Parsing
- Parse PDF (`pdfplumber`) and DOCX (`python-docx`) into plain text.
- Normalize whitespace and line breaks.
- Save parsed output to DB (`parsed_text`) and optional artifact file in `backend/storage/parsed`.
- Raise `resume_parse_failed_exception` from `exceptions/resume_exceptions.py` on failure.

## 3) Resume Data Model
- `models/resume.py` and `models/resume_skill.py` extend `Base` from `core/database.py` (Remington's setup).
- Fields on `Resume`:
  - `id`, `user_id`, `file_name`, `mime_type`, `storage_path`, `parsed_text`, `created_at`, `updated_at`
- Add `resume_skills` support for extracted categories/skills.
- Ensure `user_id` ownership checks are enforced for read/delete.
- No migration files — Remington's `Base.metadata.create_all()` creates these tables on startup.

## 4) Repository and Service Layout
- **Folder is `repository/` (singular)** — matches professor-backend naming.
- `repository/resume_repository.py` provides static methods (professor-backend pattern):
  - `create`, `get_by_id`, `get_all_by_user`, `delete`
- **Flat service files** — no nested `services/resumes/` subdirectory (matches professor-backend `services/` layout):
  - `services/resume_upload_service.py`
  - `services/resume_parse_service.py`
  - `services/resume_skill_service.py`
- Route file (`routes/resumes.py`) injects `db` via `Depends(get_db)` and the current user via `Depends(get_current_user)` from Alden's `core/dependencies.py`.
- Use Pydantic v2 style on ORM-backed schemas: `model_config = {"from_attributes": True}`.

## 5) Exception Definitions
- Create `exceptions/resume_exceptions.py` with **pre-defined `HTTPException` instances** (professor-backend pattern). Do **not** use string error codes or a structured error envelope:

```python
from fastapi import HTTPException, status

resume_not_found_exception = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Resume not found or access denied",
)
resume_access_denied_exception = HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="You do not have access to this resume",
)
file_too_large_exception = HTTPException(
    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
    detail="File exceeds the maximum allowed size",
)
file_type_unsupported_exception = HTTPException(
    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
    detail="File type is not supported",
)
resume_parse_failed_exception = HTTPException(
    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
    detail="Failed to parse resume content",
)
```

- The `401` case is handled by Alden's `token_invalid_exception` from `exceptions/auth_exceptions.py` — do not redefine it here.

## Required Tests

- Unit:
  - parser output for known PDF fixture
  - parser output for known DOCX fixture
  - reject unsupported MIME
- Integration:
  - upload/list/get/delete happy path
  - user A cannot access user B resume
  - oversized file rejection

## Definition of Done

1. Resume endpoints are complete and owner-safe.
2. File validation/parsing failures raise pre-defined `HTTPException` instances.
3. Resume + resume_skill data persists with correct foreign keys.
4. Tests cover both success and failure paths.

## Note: Update Route

The grading criteria includes CRUD (Create, Read, Update, Delete). If your wireframe included a `PUT /api/v1/resumes/{id}` endpoint, add it here. If not (e.g. users delete and re-upload instead), no update route is needed — just confirm this matches your wireframe design.
