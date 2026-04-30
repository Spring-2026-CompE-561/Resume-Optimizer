from src.app.services import ai_client


def test_local_optimizer_returns_structured_document(monkeypatch):
    monkeypatch.setattr("src.app.services.ai_client.settings.optimize_ai_mode", "local")

    result = ai_client.optimize_resume(
        prompt="prompt",
        resume_text="Jane Doe\njane@example.com | github.com/jane\nBuilt FastAPI services.",
        prioritized_keywords=["Python", "FastAPI", "PostgreSQL"],
        customization_notes="Focus on API work.",
    )

    document = result["document"]
    assert result["provider_name"] == "local"
    assert document.candidate_name == "Jane Doe"
    assert "Python" in document.skills
    assert document.sections
