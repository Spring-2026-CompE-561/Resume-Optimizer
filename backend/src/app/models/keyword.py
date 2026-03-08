from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.app.core.database import Base


class Keyword(Base):
    __tablename__ = "keywords"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    job_posting_id: Mapped[int] = mapped_column(Integer, ForeignKey("job_postings.id"), nullable=False, index=True)
    term: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str | None] = mapped_column(String, nullable=True)
    significance_score: Mapped[float] = mapped_column(Float, nullable=False)

    job_posting: Mapped["JobPosting"] = relationship(  # noqa: F821
        "JobPosting", back_populates="keywords"
    )