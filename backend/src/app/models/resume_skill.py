from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.app.core.database import Base


class ResumeSkill(Base):
    __tablename__ = "resume_skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    resume_id: Mapped[int] = mapped_column(ForeignKey("resumes.id"), nullable=False)
    category: Mapped[str | None] = mapped_column(String(255), nullable=True)
    skill_name: Mapped[str] = mapped_column(String(255), nullable=False)

    resume = relationship("Resume", back_populates="resume_skills")