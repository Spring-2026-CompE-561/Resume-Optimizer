from pathlib import Path

import pytest
from fastapi import HTTPException

from src.app.services.resume_parse_service import ResumeParseService


def test_normalize_text_cleans_whitespace() -> None:
    raw_text = "Python   Developer\r\n\r\n\r\nFastAPI\t\tDocker"
    result = ResumeParseService.normalize_text(raw_text)

    assert result == "Python Developer\n\nFastAPI Docker"


def test_parse_file_raises_when_file_missing() -> None:
    with pytest.raises(HTTPException) as exc_info:
        ResumeParseService.parse_file(
            "does/not/exist.pdf",
            "application/pdf",
        )

    assert exc_info.value.status_code == 422
    assert exc_info.value.detail == "Failed to parse resume content"


def test_parse_file_raises_for_unsupported_mime(tmp_path: Path) -> None:
    test_file = tmp_path / "resume.txt"
    test_file.write_text("sample content", encoding="utf-8")

    with pytest.raises(HTTPException) as exc_info:
        ResumeParseService.parse_file(
            str(test_file),
            "text/plain",
        )

    assert exc_info.value.status_code == 422
    assert exc_info.value.detail == "Failed to parse resume content"

def test_parse_pdf_returns_expected_text() -> None:
    fixture_path = Path("src/test/fixtures/sample_resume.pdf")

    result = ResumeParseService.parse_file(
        str(fixture_path),
        "application/pdf",
    )

    assert "John Doe" in result
    assert "Python Developer" in result
    assert "FastAPI" in result


def test_parse_docx_returns_expected_text() -> None:
    fixture_path = Path("src/test/fixtures/sample_resume.docx")

    result = ResumeParseService.parse_file(
        str(fixture_path),
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )

    assert "John Doe" in result
    assert "Python Developer" in result
    assert "FastAPI" in result