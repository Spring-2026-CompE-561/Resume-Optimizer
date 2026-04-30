from src.app.schemas.optimize import OptimizedResumeDocument, ResumeSection
from src.app.services.document_render_service import DocumentRenderService


def make_document() -> OptimizedResumeDocument:
    return OptimizedResumeDocument(
        candidate_name="Jane Doe",
        headline="Backend Engineer",
        contact_line="jane@example.com | github.com/jane",
        summary="Builds production APIs and automation systems.",
        skills=["Python", "FastAPI", "PostgreSQL"],
        sections=[
            ResumeSection(
                title="Experience",
                lines=["Built APIs with FastAPI.", "Improved system reliability by 30%."],
            )
        ],
        suggestions=["Add more metrics."],
    )


def test_render_plain_text_includes_named_sections():
    rendered = DocumentRenderService.render_plain_text(make_document())

    assert "Jane Doe" in rendered
    assert "Summary" in rendered
    assert "Skills" in rendered
    assert "- Built APIs with FastAPI." in rendered


def test_render_latex_escapes_reserved_characters():
    document = make_document()
    document.sections[0].lines.append("Managed 100% of alerts & reports.")

    rendered = DocumentRenderService.render_latex(document)

    assert r"\section*{Experience}" in rendered
    assert r"100\% of alerts \& reports." in rendered
