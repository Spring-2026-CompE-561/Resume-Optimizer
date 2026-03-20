from fastapi import HTTPException, status

database_unavailable_exception = HTTPException(
    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
    detail="Database is unavailable",
)
