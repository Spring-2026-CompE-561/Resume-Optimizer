from datetime import datetime

from pydantic import BaseModel, Field


class OptimizeRequest(BaseModel):
    resume_id: int
    job_posting_id: int


class OptimizationRunOut(BaseModel):
    id: int
    user_id: int
    resume_id: int | None
    job_posting_id: int | None
    optimized_resume_text: str
    suggestions: list[str] = Field(default_factory=list)
    provider_name: str | None = None
    latency_ms: int | None = None
    created_at: datetime

    model_config = {"from_attributes": True}