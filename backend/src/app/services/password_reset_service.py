import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from src.app.core.auth import get_password_hash
from src.app.core.settings import settings
from src.app.exceptions.auth_exceptions import reset_token_invalid_exception
from src.app.repository.auth_repository import AuthRepository


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def request_password_reset(db: Session, email: str) -> str | None:
    """Generate one-time reset token (hashed at rest). Returns plain token if user exists, else None."""
    user = AuthRepository.find_user_by_email(db, email)
    if not user:
        return None
    plain_token = secrets.token_urlsafe(32)
    token_hash = _hash_token(plain_token)
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.password_reset_token_expire_minutes
    )
    AuthRepository.create_password_reset_token(
        db,
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    return plain_token


def reset_password(db: Session, token: str, new_password: str) -> None:
    """Validate reset token (expiration + not used), set new password, invalidate token."""
    token_hash = _hash_token(token)
    prt = AuthRepository.find_password_reset_token_by_hash(db, token_hash)
    if not prt:
        raise reset_token_invalid_exception
    if prt.expires_at < datetime.now(timezone.utc):
        raise reset_token_invalid_exception
    user = AuthRepository.find_user_by_id(db, prt.user_id)
    if not user:
        raise reset_token_invalid_exception
    user.hashed_password = get_password_hash(new_password)
    AuthRepository.consume_password_reset_token(db, token_hash)
    db.commit()
