from src.app.services.prompt_builder import build_optimize_prompt


def test_prompt_includes_required_sections():
    prompt = build_optimize_prompt(
        resume_text="Built FastAPI APIs and Dockerized services.",
        job_description="Looking for Python and FastAPI experience.",
        prioritized_keywords=["Python", "FastAPI", "Docker"],
    )

    assert "CANDIDATE RESUME TEXT:" in prompt
    assert "JOB DESCRIPTION SUMMARY:" in prompt
    assert "EXTRACTED KEYWORD PRIORITIES:" in prompt
    assert "OUTPUT FORMAT CONSTRAINTS:" in prompt
    assert "- Python" in prompt
    assert "- FastAPI" in prompt
    assert "- Docker" in prompt