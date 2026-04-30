from datetime import datetime

from pydantic import BaseModel, Field, HttpUrl, model_validator


class JobPostingCreate(BaseModel):
    source_url: HttpUrl | None = None
    title: str | None = Field(default=None, max_length=255)
    company: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, min_length=20)

    @model_validator(mode="after")
    def validate_job_source(self) -> "JobPostingCreate":
        if not self.source_url and not self.description:
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
