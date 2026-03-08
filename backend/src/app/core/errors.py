from fastapi import HTTPException, status


class AppError:
    URL_INVALID = "URL_INVALID"
    SCRAPE_FAILED = "SCRAPE_FAILED"
    KEYWORD_EXTRACTION_FAILED = "KEYWORD_EXTRACTION_FAILED"
    NOT_FOUND = "NOT_FOUND"
    FORBIDDEN = "FORBIDDEN"


def url_invalid_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail={"code": AppError.URL_INVALID, "message": "The provided URL is invalid."},
    )


def scrape_failed_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail={"code": AppError.SCRAPE_FAILED, "message": "Failed to scrape job posting content."},
    )


def keyword_extraction_failed_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail={"code": AppError.KEYWORD_EXTRACTION_FAILED, "message": "Failed to extract keywords from job posting."},
    )


def not_found_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": AppError.NOT_FOUND, "message": "Resource not found."},
    )


def forbidden_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={"code": AppError.FORBIDDEN, "message": "You do not have permission to access this resource."},
    )