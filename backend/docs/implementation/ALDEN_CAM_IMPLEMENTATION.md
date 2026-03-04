# Alden Cam Backend Implementation Plan

## Ownership
- Primary domain: Authentication and token lifecycle.
- Route ownership:
  - `POST /api/auth/signup`
  - `POST /api/auth/login`
  - `GET /api/me`
  - `POST /api/auth/logout`
  - `POST /api/auth/refresh`
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/reset-password`

## Files to Create

```text
backend/src/app/core/settings.py
backend/src/app/core/auth.py
backend/src/app/routes/auth.py
backend/src/app/schemas/auth.py
backend/src/app/schemas/token.py
backend/src/app/repositories/auth_repository.py
backend/src/app/services/auth/auth_service.py
backend/src/app/services/auth/password_reset_service.py
backend/src/test/unit/test_auth_service.py
backend/src/test/integration/test_auth_routes.py
```

## Implementation Detail

## 1) Config + Security Primitives
- Add settings for:
  - `SECRET_KEY`
  - `ALGORITHM`
  - `ACCESS_TOKEN_EXPIRE_MINUTES`
  - `REFRESH_TOKEN_EXPIRE_DAYS`
  - `PASSWORD_HASH_SCHEME`
- Implement password hashing and verification in `core/auth.py`.
- Use `password_hash` only; never store plain passwords.

## 2) Auth Schemas
- Request schemas:
  - `SignupRequest(name, email, password)`
  - `LoginRequest(email, password)`
  - `RefreshRequest(refresh_token)`
  - `ForgotPasswordRequest(email)`
  - `ResetPasswordRequest(token, new_password)`
- Response schemas:
  - `AuthUserResponse`
  - `LoginResponse(access_token, refresh_token, user)`

## 3) Service Layer
- `auth_service.py`:
  - create user account
  - validate login credentials
  - create access + refresh tokens
  - revoke refresh token on logout
- `password_reset_service.py`:
  - generate one-time reset tokens (hashed at rest)
  - enforce expiration window
  - invalidate token after use

## 4) DB Interaction
- Repository methods for:
  - user create/find by email/id
  - token create/find/revoke
  - password reset token create/find/consume
- Coordinate with Remington for migrations:
  - `users.password_hash`
  - `refresh_tokens`
  - `password_reset_tokens`

## 5) Route Behavior + Errors
- Return structured errors only:
  - `AUTH_INVALID_CREDENTIALS`
  - `AUTH_EMAIL_IN_USE`
  - `AUTH_TOKEN_MISSING_OR_INVALID`
  - `AUTH_REFRESH_TOKEN_INVALID`
  - `AUTH_RESET_TOKEN_INVALID_OR_EXPIRED`
- Validate status codes exactly as in `HOWTO.md`.

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
2. Password is stored only as `password_hash`.
3. Token revocation and expiration logic is enforced.
4. OpenAPI/auth schemas reflect real responses and errors.

