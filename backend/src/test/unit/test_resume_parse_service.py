from pathlib import Path

import pytest

from src.app.exceptions.resume_exceptions import resume_parse_failed_exception
from src.app.services.resume_parse_service import ResumeParseService


def test_normalize_text_cleans_whitespace() -> None:
    raw_text = "Python   Developer\r\n\r\n\r\nFastAPI\t\tDocker"
    normalized = ResumeParseService.normalize_text(raw_text)

    assert normalized == "Python Developer\n\nFastAPI Docker"


def test_parse_file_rejects_missing_path() -> None:
    with pytest.raises(Exception) as exc_info:
        ResumeParseService.parse_file(
            "does/not/exist.pdf",
            "application/pdf",
        )

    assert exc_info.value.status_code == resume_parse_failed_exception.status_code
    assert exc_info.value.detail == resume_parse_failed_exception.detail


def test_parse_file_rejects_unsupported_mime(tmp_path: Path) -> None:
    test_file = tmp_path / "resume.txt"
    test_file.write_text("sample content")

    with pytest.raises(Exception) as exc_info:
        ResumeParseService.parse_file(
            str(test_file),
            "text/plain",
        )

    assert exc_info.value.status_code == resume_parse_failed_exception.status_code
    assert exc_info.value.detail == resume_parse_failed_exception.detail