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

user_not_found_exception = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="User not found",
)
