# Alden Cam Backend Implementation Plan

## Ownership
- Primary domain: Authentication and token lifecycle.
- Route ownership:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `GET /api/v1/auth/me`
  - `POST /api/v1/auth/logout`
  - `POST /api/v1/auth/refresh`
  - `POST /api/v1/auth/forgot-password`
  - `POST /api/v1/auth/reset-password`

## Files to Create

```text
backend/src/app/core/auth.py
backend/src/app/core/dependencies.py
backend/src/app/routes/auth.py
backend/src/app/schemas/auth.py
backend/src/app/schemas/token.py
backend/src/app/models/user.py
backend/src/app/repository/auth_repository.py
backend/src/app/services/auth_service.py
backend/src/app/services/password_reset_service.py
backend/src/app/exceptions/auth_exceptions.py
backend/src/test/unit/test_auth_service.py
backend/src/test/integration/test_auth_routes.py
```

## Implementation Detail

## 1) Config + Security Primitives
- `core/settings.py` is created by Remington. Add the following auth-specific fields to it:
  - `SECRET_KEY`
  - `ALGORITHM` (default `"HS256"`)
  - `ACCESS_TOKEN_EXPIRE_MINUTES`
  - `REFRESH_TOKEN_EXPIRE_DAYS`
  - `DATABASE_URL`
- `core/auth.py` implements (mirrors professor-backend `core/auth.py`):
  - `PasswordHash.recommended()` from `pwdlib[argon2]` — this is the library used in professor-backend, **not** bcrypt or passlib.
  - `get_password_hash(password)` and `verify_password(plain, hashed)`
  - `create_access_token(data, expires_delta)` using `pyjwt` (imported as `jwt`)
  - `verify_token(token)` returning decoded payload or `None`
  - `oauth2_scheme = OAuth2PasswordBearer(tokenUrl=...)`
- `core/dependencies.py` provides `get_current_user(token, db)` — same pattern as professor-backend `core/dependencies.py`. This is the shared dependency all other route owners will import.

## 2) Auth Schemas
- Request schemas in `schemas/auth.py`:
  - `SignupRequest(name, email, password)`
  - `LoginRequest(email, password)`
  - `RefreshRequest(refresh_token)`
  - `ForgotPasswordRequest(email)`
  - `ResetPasswordRequest(token, new_password)`
- Response schemas:
  - `AuthUserResponse`
  - `LoginResponse(access_token, refresh_token, user)` if refresh tokens are included
- `schemas/token.py`:
  - `Token(access_token, token_type)` — same shape as professor-backend
- Use Pydantic v2 style: `model_config = {"from_attributes": True}` on ORM-backed schemas.

## 3) Service Layer
- **Flat file layout** — services live directly in `services/`, not in nested subdirectories (matches professor-backend `services/user.py` pattern).
- `services/auth_service.py`:
  - create user account
  - validate login credentials
  - create access + refresh tokens
  - revoke refresh token on logout
- `services/password_reset_service.py`:
  - generate one-time reset tokens (hashed at rest)
  - enforce expiration window
  - invalidate token after use

## 4) DB Interaction
- **Folder is `repository/` (singular)** — matches professor-backend `src/app/repository/` naming, not `repositories/`.
- `repository/auth_repository.py` provides static methods (same pattern as professor-backend `repository/user.py`):
  - user create / find by email / find by id
  - refresh token create / find / revoke
  - password reset token create / find / consume
- `models/user.py` defines the `User` SQLAlchemy model extending `Base` from `core/database.py`.
- No Alembic — Remington's `Base.metadata.create_all()` in `main.py` will create the user, refresh_tokens, and password_reset_tokens tables once the model files are imported.

## 5) Exception Definitions
- Create `exceptions/auth_exceptions.py` with **pre-defined `HTTPException` instances** (professor-backend pattern). Do **not** use string error codes or a structured error envelope:

```python
from fastapi import HTTPException, status

invalid_credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)
email_in_use_exception = HTTPException(
    status_code=status.HTTP_409_CONFLICT,
    detail="Email already registered",
)
token_invalid_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Token is invalid or expired",
    headers={"WWW-Authenticate": "Bearer"},
)
reset_token_invalid_exception = HTTPException(
    status_code=status.HTTP_400_BAD_REQUEST,
    detail="Password reset token is invalid or expired",
)
```

- Routes and services `raise` these instances directly — same approach as professor-backend `exceptions/credential_exception.py` and `exceptions/category_exceptions.py`.

## Required Tests

- Unit:
  - password hash verify pass/fail
  - token create/verify/expire
  - signup rejects duplicate email
- Integration:
  - full signup -> login -> me flow
  - refresh rotation flow
  - reset token invalid/expired scenarios

## Definition of Done

1. All auth endpoints pass integration tests.
2. Password is stored only as `hashed_password`.
3. Token revocation and expiration logic is enforced.
4. `get_current_user` dependency in `core/dependencies.py` is available for other domain owners to import.
5. Exception instances in `exceptions/auth_exceptions.py` are importable by other modules.
