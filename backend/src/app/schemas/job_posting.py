from datetime import datetime

from pydantic import BaseModel, HttpUrl


class JobPostingCreate(BaseModel):
    source_url: HttpUrl


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
    source_url: str
    title: str | None
    company: str | None
    description: str | None
    created_at: datetime
    keywords: list[KeywordOut]
    skills: list[JobPostingSkillOut]

    model_config = {"from_attributes": True}