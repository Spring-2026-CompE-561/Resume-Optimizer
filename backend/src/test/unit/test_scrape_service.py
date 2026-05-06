from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from src.app.services.scrape_service import scrape_job_posting

FIXTURE_HTML = """
<html>
  <head>
    <title>Software Engineer at Acme</title>
    <script>alert('remove me')</script>
    <style>body { color: red; }</style>
  </head>
  <body>
    <h1 class="job-title">Software Engineer</h1>
    <span class="company-name">Acme Corp</span>
    <div class="job-description">
      We are looking for a Python developer with experience in FastAPI and PostgreSQL.
      You will build scalable REST APIs and work with a great team.
    </div>
  </body>
</html>
"""


def _mock_response(html: str, status_code: int = 200):
    mock_resp = MagicMock()
    mock_resp.text = html
    mock_resp.status_code = status_code
    mock_resp.raise_for_status = MagicMock()
    return mock_resp


@patch("src.app.services.scrape_service.httpx.Client")
def test_scrape_returns_title(mock_client_cls):
    mock_client_cls.return_value.__enter__.return_value.get.return_value = _mock_response(FIXTURE_HTML)
    result = scrape_job_posting("https://example.com/job/123")
    assert result["title"] == "Software Engineer"


@patch("src.app.services.scrape_service.httpx.Client")
def test_scrape_prefers_metadata_title(mock_client_cls):
    html = """
    <html>
      <head><meta property="og:title" content="Staff Platform Engineer"></head>
      <body>
        <h1 class="job-title">Platform Engineer</h1>
        <div class="job-description">
          Python FastAPI PostgreSQL Docker engineer role building reliable backend API systems.
        </div>
      </body>
    </html>
    """
    mock_client_cls.return_value.__enter__.return_value.get.return_value = _mock_response(html)
    result = scrape_job_posting("https://example.com/job/123")
    assert result["title"] == "Staff Platform Engineer"


@patch("src.app.services.scrape_service.httpx.Client")
def test_scrape_returns_company(mock_client_cls):
    mock_client_cls.return_value.__enter__.return_value.get.return_value = _mock_response(FIXTURE_HTML)
    result = scrape_job_posting("https://example.com/job/123")
    assert result["company"] == "Acme Corp"


@patch("src.app.services.scrape_service.httpx.Client")
def test_scrape_returns_normalized_description(mock_client_cls):
    mock_client_cls.return_value.__enter__.return_value.get.return_value = _mock_response(FIXTURE_HTML)
    result = scrape_job_posting("https://example.com/job/123")
    description = result["description"]
    assert description is not None
    assert "python" in description.lower()
    assert "fastapi" in description.lower()
    # Normalized: no leading/trailing whitespace, no consecutive spaces
    assert not description.startswith(" ")
    assert not description.endswith(" ")
    assert "  " not in description


@patch("src.app.services.scrape_service.httpx.Client")
def test_scrape_strips_scripts_and_styles(mock_client_cls):
    mock_client_cls.return_value.__enter__.return_value.get.return_value = _mock_response(FIXTURE_HTML)
    result = scrape_job_posting("https://example.com/job/123")
    assert "alert" not in (result["description"] or "")
    assert "color: red" not in (result["description"] or "")


@patch("src.app.services.scrape_service.httpx.Client")
def test_scrape_returns_content_hash(mock_client_cls):
    mock_client_cls.return_value.__enter__.return_value.get.return_value = _mock_response(FIXTURE_HTML)
    result = scrape_job_posting("https://example.com/job/123")
    assert "content_hash" in result
    assert len(result["content_hash"]) == 64  # SHA-256 hex digest


@patch("src.app.services.scrape_service.httpx.Client")
def test_scrape_raises_on_http_error(mock_client_cls):
    import httpx
    mock_client_cls.return_value.__enter__.return_value.get.side_effect = httpx.HTTPError("connection failed")
    with pytest.raises(HTTPException) as exc_info:
        scrape_job_posting("https://example.com/job/123")
    assert exc_info.value.status_code == 422


@patch("src.app.services.scrape_service.httpx.Client")
def test_scrape_raises_when_no_description(mock_client_cls):
    # Body is empty after stripping — no selector will yield content
    empty_html = "<html><body>   </body></html>"
    mock_client_cls.return_value.__enter__.return_value.get.return_value = _mock_response(empty_html)
    with pytest.raises(HTTPException) as exc_info:
        scrape_job_posting("https://example.com/job/123")
    assert exc_info.value.status_code == 422
