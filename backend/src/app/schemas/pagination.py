from math import ceil

from pydantic import BaseModel, Field

DEFAULT_PAGE = 1
DEFAULT_LIMIT = 10
MAX_LIMIT = 50


class PaginationMeta(BaseModel):
    page: int = Field(..., ge=1)
    limit: int = Field(..., ge=1, le=MAX_LIMIT)
    total: int = Field(..., ge=0)
    pages: int = Field(..., ge=0)
    has_next: bool
    has_previous: bool


def build_pagination_meta(*, page: int, limit: int, total: int) -> PaginationMeta:
    pages = ceil(total / limit) if total else 0
    return PaginationMeta(
        page=page,
        limit=limit,
        total=total,
        pages=pages,
        has_next=page < pages,
        has_previous=page > 1 and pages > 0,
    )


def pagination_offset(*, page: int, limit: int) -> int:
    return (page - 1) * limit
