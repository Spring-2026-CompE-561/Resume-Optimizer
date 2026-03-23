import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.app.core.database import Base
from src.app.models import job_posting, job_posting_skill, keyword  # noqa: F401 - register tables
from src.app.repository.job_posting_repository import JobPostingRepository
from src.app.services.keyword_service import extract_and_persist_keywords

SQLITE_TEST_URL = "sqlite:///:memory:"


@pytest.fixture
def db_session():
    engine = create_engine(
        SQLITE_TEST_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def job_posting_record(db_session):
    return JobPostingRepository.create(
        db_session,
        owner_id=1,
        source_url="https://example.com/job/1",
        content_hash="abc123",
        title="Software Engineer",
        company="Acme",
        description="placeholder",
    )


def test_keyword_extraction_is_deterministic(db_session, job_posting_record):
    description = (
        "python python python fastapi fastapi sql sql sql sql "
        "docker docker kubernetes aws aws rest api developer"
    )
    extract_and_persist_keywords(db_session, job_posting_record.id, description)
    db_session.refresh(job_posting_record)

    terms = [kw.term for kw in job_posting_record.keywords]

    # Running again on a second posting should produce same terms
    posting2 = JobPostingRepository.create(
        db_session,
        owner_id=1,
        source_url="https://example.com/job/2",
        content_hash="def456",
        title="Engineer",
        company="Acme",
        description="placeholder",
    )
    extract_and_persist_keywords(db_session, posting2.id, description)
    db_session.refresh(posting2)

    terms2 = [kw.term for kw in posting2.keywords]
    assert terms == terms2


def test_keyword_extraction_top_terms_are_most_frequent(db_session, job_posting_record):
    description = (
        "python python python python fastapi fastapi sql docker aws rest"
    )
    extract_and_persist_keywords(db_session, job_posting_record.id, description)
    db_session.refresh(job_posting_record)

    terms = [kw.term for kw in job_posting_record.keywords]
    # python appears most — should be present
    assert "python" in terms


def test_keyword_extraction_persists_skills(db_session, job_posting_record):
    description = "python fastapi docker kubernetes aws postgresql redis"
    extract_and_persist_keywords(db_session, job_posting_record.id, description)
    db_session.refresh(job_posting_record)

    skill_names = {s.skill_name for s in job_posting_record.skills}
    assert "python" in skill_names
    assert "docker" in skill_names


def test_keyword_extraction_scores_are_floats(db_session, job_posting_record):
    description = "python developer fastapi rest api docker aws cloud"
    extract_and_persist_keywords(db_session, job_posting_record.id, description)
    db_session.refresh(job_posting_record)

    for kw in job_posting_record.keywords:
        assert isinstance(kw.significance_score, float)
        assert kw.significance_score > 0.0


def test_keyword_extraction_raises_on_empty_description(db_session, job_posting_record):
    with pytest.raises(HTTPException) as exc_info:
        extract_and_persist_keywords(db_session, job_posting_record.id, "")
    assert exc_info.value.status_code == 422


def test_keyword_extraction_raises_on_stopwords_only(db_session, job_posting_record):
    with pytest.raises(HTTPException) as exc_info:
        extract_and_persist_keywords(db_session, job_posting_record.id, "the and or but is are")
    assert exc_info.value.status_code == 422
