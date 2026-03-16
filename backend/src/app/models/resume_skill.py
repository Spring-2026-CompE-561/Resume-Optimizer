from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class ResumeSkill(Base):
    # SQLAlchemy will create/use a table named "resume_skills" for this model.
    __tablename__ = "resume_skills"

    # Primary key for each extracted skill row.
    id = Column(Integer, primary_key=True, index=True)

    # Connects each skill row back to the parent resume.
    # ForeignKey("resumes.id") means every ResumeSkill must belong to a valid Resume.
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=False)

    # Optional grouping label for the skill, such as "Languages", "Frameworks",
    # or "Tools". Nullable is okay because extracted skills may not always have
    # a clean category assigned yet.
    category = Column(String, nullable=True)

    # The actual extracted skill value, such as "Python" or "FastAPI".
    skill_name = Column(String, nullable=False)

    # Many-to-one relationship back to the Resume model.
    # This lets code do things like resume_skill.resume.
    resume = relationship("Resume", back_populates="resume_skills")