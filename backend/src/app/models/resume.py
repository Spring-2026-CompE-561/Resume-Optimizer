from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from src.app.core.database import Base

class Resume(Base):
    # SQLAlchemy will create/use a table named "resumes" for this model.
    __tablename__ = "resumes"

    # Primary key for each resume row.
    # Matches the Integer primary key style already used in the project.
    id = Column(Integer, primary_key=True, index=True)

    # Connects each resume to the user who uploaded it.
    # ForeignKey("users.id") means this value must point to a valid User row.
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Original uploaded file name, such as "amarjot_resume.pdf".
    file_name = Column(String, nullable=False)

    # Stores the uploaded file MIME type so validation and parsing logic
    # can tell whether the file is a PDF, DOCX, etc.
    mime_type = Column(String, nullable=False)

    # Path to where the original uploaded file is stored on disk.
    storage_path = Column(String, nullable=False)

    # Parsed plain text extracted from the resume.
    # Text is better than String here because resume contents can be long.
    parsed_text = Column(Text, nullable=True)

    # Timestamp for when the row was first created.
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Timestamp for the most recent update to the row.
    # onupdate=datetime.utcnow automatically refreshes it when the row changes.
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # We are not using back_populates here yet because the User model
    # does not currently appear to define a matching resumes relationship.
    user = relationship("User")

    # One-to-many relationship: one Resume can have many ResumeSkill rows.
    # This lets code do things like resume.resume_skills.
    resume_skills = relationship("ResumeSkill", back_populates="resume")