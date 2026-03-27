def build_optimize_prompt(
    *,
    resume_text: str,
    job_description: str,
    prioritized_keywords: list[str],
) -> str:
    cleaned_resume = (resume_text or "").strip() or "(no parsed resume text available)"
    cleaned_job = (job_description or "").strip() or "(no job description available)"
    cleaned_keywords = [kw.strip() for kw in prioritized_keywords if kw and kw.strip()]

    keyword_block = "\n".join(f"- {kw}" for kw in cleaned_keywords) or "- none"

    return "\n".join(
        [
            "You are a deterministic resume optimization assistant.",
            "",
            "TASK:",
            "Rewrite the candidate resume so it better aligns with the job description.",
            "Do not invent experience, degrees, certifications, or technologies.",
            "Preserve truthful content and improve alignment, clarity, and phrasing.",
            "",
            "CANDIDATE RESUME TEXT:",
            cleaned_resume,
            "",
            "JOB DESCRIPTION SUMMARY:",
            cleaned_job,
            "",
            "EXTRACTED KEYWORD PRIORITIES:",
            keyword_block,
            "",
            "OUTPUT FORMAT CONSTRAINTS:",
            "1. Return optimized resume text only.",
            "2. Make the language concise and professional.",
            "3. Emphasize relevant experience already present in the resume.",
            "4. Do not use markdown fences.",
        ]
    )