import os


class AIRateLimitError(Exception):
    pass


class AIProviderError(Exception):
    pass


def optimize_resume(
    *,
    prompt: str,
    resume_text: str,
    prioritized_keywords: list[str],
) -> dict:
    mode = os.getenv("OPTIMIZE_AI_MODE", "local").lower()

    if mode == "rate_limit":
        raise AIRateLimitError("AI provider rate limited the request")

    if mode == "fail":
        raise AIProviderError("AI provider failed to generate optimization")

    cleaned_resume = (resume_text or "").strip()
    cleaned_keywords = [kw.strip() for kw in prioritized_keywords if kw and kw.strip()]

    keyword_summary = ", ".join(cleaned_keywords[:10]) or "No prioritized keywords detected"

    optimized_text = cleaned_resume
    if keyword_summary:
        optimized_text += f"\n\nTargeted Keywords: {keyword_summary}"

    suggestions = [
        f"Highlight measurable results related to {kw}."
        for kw in cleaned_keywords[:5]
    ]

    if not suggestions:
        suggestions = [
            "Quantify accomplishments with numbers where possible.",
            "Use stronger action verbs in experience bullets.",
            "Align resume wording more closely with the job description.",
        ]

    return {
        "optimized_resume_text": optimized_text,
        "suggestions": suggestions,
        "provider_name": mode,
        "prompt_used": prompt,
    }