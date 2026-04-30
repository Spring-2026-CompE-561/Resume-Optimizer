from fastapi import HTTPException, status

ai_optimization_failed_exception = HTTPException(
    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
    detail="AI optimization failed",
)

ai_rate_limited_exception = HTTPException(
    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
    detail="AI provider rate limit exceeded, please try again later",
)

optimization_run_not_found_exception = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Optimization run not found",
)

optimization_pdf_unavailable_exception = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Optimization PDF is not available",
)
