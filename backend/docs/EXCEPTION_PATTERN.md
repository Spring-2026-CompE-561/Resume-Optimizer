# Backend Exception Pattern

This project follows the professor-backend error style: define reusable `HTTPException`
instances in `src/app/exceptions/` and raise those instances directly from routes and
services.

## Rules

1. Create one module per domain:
   - `src/app/exceptions/auth_exceptions.py`
   - `src/app/exceptions/resume_exceptions.py`
   - `src/app/exceptions/job_posting_exceptions.py`
   - `src/app/exceptions/optimize_exceptions.py`
   - `src/app/exceptions/platform_exceptions.py`
2. Define exceptions once at module scope.
3. Import and `raise` those pre-built exceptions directly.
4. Reuse shared auth exceptions for authentication failures across domains.

## Do Not Add

- `schemas/error.py`
- global error envelope objects like `{"success": false, "error": {...}}`
- string error codes in place of `HTTPException`
- custom global error middleware for normal route/service errors

## Example

```python
from fastapi import HTTPException, status

email_in_use_exception = HTTPException(
    status_code=status.HTTP_409_CONFLICT,
    detail="Email already registered",
)
```

```python
from src.app.exceptions.auth_exceptions import email_in_use_exception

if existing_user:
    raise email_in_use_exception
```

## Current Shared Exceptions

- Auth owns 401, credential, and password reset exceptions.
- Platform owns cross-cutting bootstrap exceptions such as DB health failures.
- Other domains should keep only their domain-specific exceptions in their own modules.
