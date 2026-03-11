from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from src.app.core.auth import oauth2_scheme, verify_token
from src.app.core.database import get_db
from src.app.exceptions.auth_exceptions import token_invalid_exception, user_not_found_exception
from src.app.models.user import User
from src.app.repository.auth_repository import AuthRepository


def get_current_user(
    token: Annotated[str | None, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    if not token:
        raise token_invalid_exception
    payload = verify_token(token)
    if not payload or payload.get("type") != "access":
        raise token_invalid_exception
    sub = payload.get("sub")
    if not sub:
        raise token_invalid_exception
    user = AuthRepository.find_user_by_id(db, int(sub))
    if not user:
        raise user_not_found_exception
    if not user.is_active:
        raise token_invalid_exception
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
