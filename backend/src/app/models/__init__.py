# Import all currently implemented models so SQLAlchemy registers them with Base.metadata

from app.models.resume import Resume
from app.models.resume_skill import ResumeSkill

__all__ = [
    "Resume",
    "ResumeSkill",
]