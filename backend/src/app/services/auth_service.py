import hashlib
import secrets
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from src.app.core.auth import create_access_token, get_password_hash, verify_password, verify_token
from src.app.core.settings import settings
from src.app.exceptions.auth_exceptions import (
    email_in_use_exception,
    invalid_credentials_exception,
    token_invalid_exception,
)
from src.app.repository.auth_repository import AuthRepository
from src.app.schemas.auth import AuthUserResponse, LoginRequest, LoginResponse, SignupRequest


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_user_account(db: Session, data: SignupRequest) -> LoginResponse:
    if AuthRepository.find_user_by_email(db, data.email):
        raise email_in_use_exception
    user = AuthRepository.create_user(
        db,
        email=data.email,
        hashed_password=get_password_hash(data.password),
        name=data.name,
    )
    access_token = create_access_token(str(user.id))
    refresh_token_plain = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    AuthRepository.create_refresh_token(
        db,
        user_id=user.id,
        token_hash=_hash_token(refresh_token_plain),
        expires_at=expires_at,
    )
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token_plain,
        user=AuthUserResponse.model_validate(user),
    )


def validate_login(db: Session, data: LoginRequest) -> LoginResponse:
    user = AuthRepository.find_user_by_email(db, data.email)
    if not user or not verify_password(data.password, user.hashed_password):
        raise invalid_credentials_exception
    if not user.is_active:
        raise invalid_credentials_exception
    access_token = create_access_token(str(user.id))
    refresh_token_plain = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    AuthRepository.create_refresh_token(
        db,
        user_id=user.id,
        token_hash=_hash_token(refresh_token_plain),
        expires_at=expires_at,
    )
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token_plain,
        user=AuthUserResponse.model_validate(user),
    )


def create_tokens_from_refresh(db: Session, refresh_token: str) -> LoginResponse:
    token_hash = _hash_token(refresh_token)
    rt = AuthRepository.find_refresh_token_by_hash(db, token_hash)
    if not rt or rt.expires_at < datetime.utcnow():
        raise token_invalid_exception
    user = AuthRepository.find_user_by_id(db, rt.user_id)
    if not user or not user.is_active:
        raise token_invalid_exception
    access_token = create_access_token(str(user.id))
    new_refresh_plain = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    AuthRepository.revoke_refresh_token(db, token_hash)
    AuthRepository.create_refresh_token(
        db,
        user_id=user.id,
        token_hash=_hash_token(new_refresh_plain),
        expires_at=expires_at,
    )
    return LoginResponse(
        access_token=access_token,
        refresh_token=new_refresh_plain,
        user=AuthUserResponse.model_validate(user),
    )


def revoke_refresh_token(db: Session, refresh_token: str) -> None:
    token_hash = _hash_token(refresh_token)
    AuthRepository.revoke_refresh_token(db, token_hash)
