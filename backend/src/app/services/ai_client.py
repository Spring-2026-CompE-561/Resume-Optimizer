import json
from time import perf_counter

from openai import APIError, APITimeoutError, OpenAI, RateLimitError
from pydantic import ValidationError

from src.app.core.settings import settings
from src.app.schemas.optimize import OptimizedResumeDocument, ResumeSection


class AIRateLimitError(Exception):
    pass


class AIProviderError(Exception):
    pass


def _normalize_resume_lines(resume_text: str) -> list[str]:
    return [line.strip(" -•\t") for line in resume_text.splitlines() if line.strip()]


def _select_candidate_name(lines: list[str]) -> str:
    if not lines:
        return "Optimized Candidate"
    name = lines[0]
    return name[:80]


def _select_contact_line(lines: list[str]) -> str | None:
    for line in lines[1:4]:
        if "@" in line or "|" in line or "linkedin" in line.lower():
            return line[:160]
    return None


def _build_local_document(
    *,
    resume_text: str,
    prioritized_keywords: list[str],
    customization_notes: str | None,
) -> OptimizedResumeDocument:
    lines = _normalize_resume_lines(resume_text)
    candidate_name = _select_candidate_name(lines)
    contact_line = _select_contact_line(lines)

    body_lines = [
        line
        for line in lines[1:]
        if line != contact_line and len(line.split()) > 2
    ]
    unique_keywords = []
    seen_keywords = set()
    for keyword in prioritized_keywords:
        cleaned = keyword.strip()
        lowered = cleaned.lower()
        if cleaned and lowered not in seen_keywords:
            seen_keywords.add(lowered)
            unique_keywords.append(cleaned)

    focus_summary = ", ".join(unique_keywords[:4]) or "the target role"
    summary = (
        f"Tailored resume draft aligned to {focus_summary}. "
        "Emphasizes truthful experience from the uploaded resume."
    )
    if customization_notes:
        summary += f" Custom notes applied: {customization_notes.strip()[:180]}"

    highlight_lines = body_lines[:6]
    if not highlight_lines:
        highlight_lines = [
            "Refine experience bullets to match the job description.",
            "Highlight measurable outcomes and relevant tools.",
        ]

    sections = [
        ResumeSection(title="Targeted Highlights", lines=highlight_lines),
        ResumeSection(
            title="Role Alignment",
            lines=[
                f"Prioritize experience that demonstrates {keyword}."
                for keyword in unique_keywords[:4]
            ]
            or ["Highlight the most role-relevant experience first."],
        ),
    ]

    suggestions = [
        f"Add measurable impact for {keyword} experience."
        for keyword in unique_keywords[:3]
    ]
    if not suggestions:
        suggestions = [
            "Quantify accomplishments with metrics where possible.",
            "Lead bullets with stronger action verbs.",
            "Mirror the job description terminology when it stays truthful.",
        ]

    return OptimizedResumeDocument(
        candidate_name=candidate_name,
        headline="Targeted Resume Draft",
        contact_line=contact_line,
        summary=summary,
        skills=unique_keywords[:8],
        sections=sections,
        suggestions=suggestions,
    )


def _optimize_locally(
    *,
    resume_text: str,
    prioritized_keywords: list[str],
    customization_notes: str | None,
    prompt: str,
) -> dict:
    document = _build_local_document(
        resume_text=resume_text,
        prioritized_keywords=prioritized_keywords,
        customization_notes=customization_notes,
    )
    return {
        "document": document,
        "suggestions": document.suggestions,
        "provider_name": "local",
        "latency_ms": 0,
        "prompt_used": prompt,
    }


def _optimize_with_openai(
    *,
    prompt: str,
) -> dict:
    if not settings.openai_api_key:
        raise AIProviderError("OPENAI_API_KEY is required when OPTIMIZE_AI_MODE=openai")

    client = OpenAI(api_key=settings.openai_api_key, timeout=settings.openai_timeout_seconds)
    started_at = perf_counter()
    try:
        response = client.responses.create(
            model=settings.openai_model,
            input=prompt,
            reasoning={"effort": settings.openai_reasoning_effort},
        )
    except RateLimitError as exc:
        raise AIRateLimitError(str(exc)) from exc
    except (APIError, APITimeoutError) as exc:
        raise AIProviderError(str(exc)) from exc

    latency_ms = int((perf_counter() - started_at) * 1000)
    raw_output = (response.output_text or "").strip()
    if not raw_output:
        raise AIProviderError("OpenAI returned an empty response")

    try:
        payload = json.loads(raw_output)
        document = OptimizedResumeDocument.model_validate(payload)
    except (json.JSONDecodeError, ValidationError) as exc:
        raise AIProviderError("OpenAI returned an invalid optimization payload") from exc

    return {
        "document": document,
        "suggestions": document.suggestions,
        "provider_name": f"openai:{settings.openai_model}",
        "latency_ms": latency_ms,
        "prompt_used": prompt,
    }


def optimize_resume(
    *,
    prompt: str,
    resume_text: str,
    prioritized_keywords: list[str],
    customization_notes: str | None = None,
) -> dict:
    mode = settings.optimize_ai_mode

    if mode == "rate_limit":
        raise AIRateLimitError("AI provider rate limited the request")

    if mode == "fail":
        raise AIProviderError("AI provider failed to generate optimization")

    if mode == "openai":
        return _optimize_with_openai(prompt=prompt)

    return _optimize_locally(
        prompt=prompt,
        resume_text=resume_text,
        prioritized_keywords=prioritized_keywords,
        customization_notes=customization_notes,
    )
