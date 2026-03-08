from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.app.core.database import Base


class JobPostingSkill(Base):
    __tablename__ = "job_posting_skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    job_posting_id: Mapped[int] = mapped_column(Integer, ForeignKey("job_postings.id"), nullable=False, index=True)
    skill_name: Mapped[str] = mapped_column(String, nullable=False)

    job_posting: Mapped["JobPosting"] = relationship(  # noqa: F821
        "JobPosting", back_populates="skills"
    )