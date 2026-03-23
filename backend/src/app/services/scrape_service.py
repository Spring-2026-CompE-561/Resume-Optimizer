import hashlib
import re

import httpx
from bs4 import BeautifulSoup

from src.app.exceptions.job_posting_exceptions import scrape_failed_exception

_TIMEOUT = 10.0
_MAX_RETRIES = 2


def _fetch_html(url: str) -> str:
    for attempt in range(_MAX_RETRIES + 1):
        try:
            with httpx.Client(timeout=_TIMEOUT, follow_redirects=True) as client:
                response = client.get(url)
                response.raise_for_status()
                return response.text
        except httpx.HTTPError:
            if attempt == _MAX_RETRIES:
                raise scrape_failed_exception


def _normalize_text(text: str) -> str:
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _extract_field(soup: BeautifulSoup, selectors: list[str]) -> str | None:
    for selector in selectors:
        tag = soup.select_one(selector)
        if tag and tag.get_text(strip=True):
            return _normalize_text(tag.get_text(separator=" "))
    return None


def scrape_job_posting(url: str) -> dict:
    """Fetch and parse a job posting URL. Returns title, company, description, and content_hash."""
    try:
        html = _fetch_html(url)
    except Exception:
        raise scrape_failed_exception

    soup = BeautifulSoup(html, "html.parser")

    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()

    title = _extract_field(soup, [
        "[class*='job-title']",
        "[class*='jobtitle']",
        "[class*='position-title']",
        "h1",
    ])

    company = _extract_field(soup, [
        "[class*='company-name']",
        "[class*='companyName']",
        "[class*='employer']",
        "[class*='organization']",
    ])

    description = _extract_field(soup, [
        "[class*='job-description']",
        "[class*='jobDescription']",
        "[class*='description']",
        "main",
        "article",
        "body",
    ])

    if not description:
        raise scrape_failed_exception

    content_hash = hashlib.sha256((title or "" + (description or "")).encode()).hexdigest()

    return {
        "title": title,
        "company": company,
        "description": description,
        "content_hash": content_hash,
    }
