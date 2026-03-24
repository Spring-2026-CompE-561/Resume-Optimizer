from fastapi import HTTPException, status

job_posting_not_found_exception = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Job posting not found or access denied",
)

url_invalid_exception = HTTPException(
    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
    detail="The provided URL is invalid",
)

scrape_failed_exception = HTTPException(
    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
    detail="Failed to scrape content from the provided URL",
)

keyword_extraction_failed_exception = HTTPException(
    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
    detail="Keyword extraction failed",
)
