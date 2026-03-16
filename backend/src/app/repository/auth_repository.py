from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from src.app.models.password_reset_token import PasswordResetToken
from src.app.models.refresh_token import RefreshToken
from src.app.models.user import User


class AuthRepository:
    """Static-style methods for user, refresh token, and password reset token operations."""

    @staticmethod
    def create_user(
        db: Session,
        email: str,
        hashed_password: str,
        name: str | None = None,
    ) -> User:
        user = User(email=email, hashed_password=hashed_password, name=name)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def find_user_by_email(db: Session, email: str) -> User | None:
        return db.scalars(select(User).where(User.email == email)).first()

    @staticmethod
    def find_user_by_id(db: Session, user_id: int) -> User | None:
        return db.scalars(select(User).where(User.id == user_id)).first()

    @staticmethod
    def create_refresh_token(
        db: Session,
        user_id: int,
        token_hash: str,
        expires_at: datetime,
    ) -> RefreshToken:
        rt = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        db.add(rt)
        db.commit()
        db.refresh(rt)
        return rt

    @staticmethod
    def find_refresh_token_by_hash(
        db: Session,
        token_hash: str,
    ) -> RefreshToken | None:
        return (
            db.scalars(
                select(RefreshToken).where(
                    RefreshToken.token_hash == token_hash,
                    RefreshToken.revoked.is_(False),
                )
            ).first()
        )

    @staticmethod
    def revoke_refresh_token(db: Session, token_hash: str) -> None:
        rt = (
            db.scalars(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
            .first()
        )
        if rt:
            rt.revoked = True
            db.commit()

    @staticmethod
    def create_password_reset_token(
        db: Session,
        user_id: int,
        token_hash: str,
        expires_at: datetime,
    ) -> PasswordResetToken:
        prt = PasswordResetToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        db.add(prt)
        db.commit()
        db.refresh(prt)
        return prt

    @staticmethod
    def find_password_reset_token_by_hash(
        db: Session,
        token_hash: str,
    ) -> PasswordResetToken | None:
        return db.scalars(
            select(PasswordResetToken).where(
                PasswordResetToken.token_hash == token_hash,
                PasswordResetToken.used_at.is_(None),
            )
        ).first()

    @staticmethod
    def consume_password_reset_token(db: Session, token_hash: str) -> None:
        prt = (
            db.scalars(
                select(PasswordResetToken).where(
                    PasswordResetToken.token_hash == token_hash
                )
            ).first()
        )
        if prt:
            prt.used_at = datetime.utcnow()
            db.commit()
