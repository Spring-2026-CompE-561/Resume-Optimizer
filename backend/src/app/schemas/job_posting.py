from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator, model_validator

from src.app.schemas.pagination import PaginationMeta


class JobPostingCreate(BaseModel):
    source_url: HttpUrl | None = None
    title: str | None = Field(default=None, max_length=255)
    company: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, min_length=20)

    model_config = ConfigDict(extra="forbid")

    @field_validator("source_url", "title", "company", "description", mode="before")
    @classmethod
    def blank_strings_to_none(cls, value: object) -> object:
        if isinstance(value, str):
            stripped = value.strip()
            return stripped or None
        return value

    @model_validator(mode="after")
    def validate_job_source(self) -> "JobPostingCreate":
        if self.source_url:
            if self.company or self.description:
                raise ValueError("URL entries may only include source_url and optional title")
            return self

        if not self.description:
            raise ValueError("Provide either a source_url or a job description")
        return self


class KeywordOut(BaseModel):
    id: int
    term: str
    category: str | None
    significance_score: float

    model_config = {"from_attributes": True}


class JobPostingSkillOut(BaseModel):
    id: int
    skill_name: str

    model_config = {"from_attributes": True}


class JobPostingOut(BaseModel):
    id: int
    owner_id: int
    source_url: str | None
    title: str | None
    company: str | None
    description: str | None
    created_at: datetime
    updated_at: datetime
    keywords: list[KeywordOut]
    skills: list[JobPostingSkillOut]

    model_config = {"from_attributes": True}


class JobPostingListResponse(BaseModel):
    items: list[JobPostingOut]
    pagination: PaginationMeta
