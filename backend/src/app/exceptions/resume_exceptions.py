from fastapi import HTTPException, status

resume_not_found_exception = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Resume not found or access denied",
)

resume_access_denied_exception = HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="You do not have access to this resume",
)

file_too_large_exception = HTTPException(
    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
    detail="File exceeds the maximum allowed size",
)

file_type_unsupported_exception = HTTPException(
    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
    detail="File type is not supported",
)

resume_parse_failed_exception = HTTPException(
    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
    detail="Failed to parse resume content",
)