from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.app.core.database import get_db
from src.app.core.dependencies import CurrentUser
from src.app.schemas.auth import (
    AuthUserResponse,
    ForgotPasswordRequest,
    LoginRequest,
    LoginResponse,
    RefreshRequest,
    ResetPasswordRequest,
    SignupRequest,
)
from src.app.services import auth_service
from src.app.services import password_reset_service

api_router = APIRouter(prefix="/auth", tags=["auth"])


@api_router.post("/register", response_model=LoginResponse)
def register(
    data: SignupRequest,
    db: Annotated[Session, Depends(get_db)],
) -> LoginResponse:
    return auth_service.create_user_account(db, data)


@api_router.post("/login", response_model=LoginResponse)
def login(
    data: LoginRequest,
    db: Annotated[Session, Depends(get_db)],
) -> LoginResponse:
    return auth_service.validate_login(db, data)


@api_router.get("/me", response_model=AuthUserResponse)
def me(user: CurrentUser) -> AuthUserResponse:
    return AuthUserResponse.model_validate(user)


@api_router.post("/logout")
def logout(
    data: RefreshRequest,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    auth_service.revoke_refresh_token(db, data.refresh_token)
    return {"message": "Logged out"}


@api_router.post("/refresh", response_model=LoginResponse)
def refresh(
    data: RefreshRequest,
    db: Annotated[Session, Depends(get_db)],
) -> LoginResponse:
    return auth_service.create_tokens_from_refresh(db, data.refresh_token)


@api_router.post("/forgot-password")
def forgot_password(
    data: ForgotPasswordRequest,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    token = password_reset_service.request_password_reset(db, data.email)
    if token:
        return {"message": "If the email exists, a reset link has been sent.", "reset_token": token}
    return {"message": "If the email exists, a reset link has been sent."}


@api_router.post("/reset-password")
def reset_password(
    data: ResetPasswordRequest,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    password_reset_service.reset_password(db, data.token, data.new_password)
    return {"message": "Password has been reset."}


router = api_router
