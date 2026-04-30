from datetime import datetime

from pydantic import BaseModel, Field


class ResumeSection(BaseModel):
    title: str
    lines: list[str] = Field(default_factory=list)


class OptimizedResumeDocument(BaseModel):
    candidate_name: str = "Optimized Candidate"
    headline: str | None = None
    contact_line: str | None = None
    summary: str | None = None
    skills: list[str] = Field(default_factory=list)
    sections: list[ResumeSection] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)


class OptimizeRequest(BaseModel):
    resume_id: int
    job_posting_id: int
    customization_notes: str | None = Field(default=None, max_length=2000)


class RegenerateOptimizationRequest(BaseModel):
    customization_notes: str | None = Field(default=None, max_length=2000)


class OptimizationRunOut(BaseModel):
    id: int
    user_id: int
    resume_id: int | None
    job_posting_id: int | None
    optimized_resume_text: str
    latex_content: str
    suggestions: list[str] = Field(default_factory=list)
    job_keywords: list[str] = Field(default_factory=list)
    customization_notes: str | None = None
    target_job_title: str | None = None
    target_company: str | None = None
    provider_name: str | None = None
    latency_ms: int | None = None
    pdf_download_url: str | None = None
    created_at: datetime


class OptimizationRunCollection(BaseModel):
    items: list[OptimizationRunOut]
