def build_optimize_prompt(
    *,
    resume_text: str,
    job_description: str,
    prioritized_keywords: list[str],
    customization_notes: str | None = None,
    target_title: str | None = None,
    target_company: str | None = None,
) -> str:
    cleaned_resume = (resume_text or "").strip() or "(no parsed resume text available)"
    cleaned_job = (job_description or "").strip() or "(no job description available)"
    cleaned_keywords = [kw.strip() for kw in prioritized_keywords if kw and kw.strip()]
    cleaned_notes = (customization_notes or "").strip() or "No additional customization notes provided."
    cleaned_title = (target_title or "").strip() or "Unknown title"
    cleaned_company = (target_company or "").strip() or "Unknown company"

    keyword_block = "\n".join(f"- {kw}" for kw in cleaned_keywords) or "- none"

    return "\n".join(
        [
            "You are a deterministic resume optimization assistant.",
            "",
            "TASK:",
            "Rewrite the candidate resume so it better aligns with the job description.",
            "Do not invent experience, degrees, certifications, or technologies.",
            "Preserve truthful content and improve alignment, clarity, and phrasing.",
            "Return a JSON object with this exact top-level schema:",
            "{",
            '  "candidate_name": string,',
            '  "headline": string | null,',
            '  "contact_line": string | null,',
            '  "summary": string | null,',
            '  "skills": string[],',
            '  "sections": [{ "title": string, "lines": string[] }],',
            '  "suggestions": string[]',
            "}",
            "Keep the JSON valid and do not wrap it in markdown fences.",
            "",
            "TARGET ROLE:",
            f"Title: {cleaned_title}",
            f"Company: {cleaned_company}",
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
            "USER CUSTOMIZATION NOTES:",
            cleaned_notes,
            "",
            "OUTPUT QUALITY CONSTRAINTS:",
            "1. Make the language concise and professional.",
            "2. Emphasize relevant experience already present in the resume.",
            "3. Keep every bullet rooted in the provided resume content.",
            "4. Prefer one-page resume structure with compact, accomplishment-oriented bullets.",
        ]
    )
