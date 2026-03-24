from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from src.app.core.database import Base


class OptimizationRun(Base):
    __tablename__ = "optimization_runs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=True)
    job_posting_id = Column(Integer, ForeignKey("job_postings.id"), nullable=True)
    optimized_resume_text = Column(Text, nullable=False)
    suggestions = Column(JSON, nullable=False, default=list)
    provider_name = Column(String(100), nullable=True)
    latency_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    resume = relationship("Resume")
    job_posting = relationship("JobPosting")