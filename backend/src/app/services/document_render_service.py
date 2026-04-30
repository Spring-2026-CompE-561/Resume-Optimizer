from pathlib import Path
import re
from xml.sax.saxutils import escape

from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

from src.app.core.settings import settings
from src.app.schemas.optimize import OptimizedResumeDocument, ResumeSection

LATEX_ESCAPE_MAP = {
    "\\": r"\textbackslash{}",
    "&": r"\&",
    "%": r"\%",
    "$": r"\$",
    "#": r"\#",
    "_": r"\_",
    "{": r"\{",
    "}": r"\}",
    "~": r"\textasciitilde{}",
    "^": r"\textasciicircum{}",
}


def _clean_line(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _escape_latex(text: str) -> str:
    escaped = text
    for source, target in LATEX_ESCAPE_MAP.items():
        escaped = escaped.replace(source, target)
    return escaped


def _escape_pdf(text: str) -> str:
    return escape(text, {'"': "&quot;"})


def _iter_document_lines(document: OptimizedResumeDocument) -> list[str]:
    lines: list[str] = []
    if document.summary:
        lines.append(document.summary)
    if document.skills:
        lines.append(f"Skills: {', '.join(document.skills)}")
    for section in document.sections:
        lines.append(section.title)
        lines.extend(section.lines)
    return [_clean_line(line) for line in lines if _clean_line(line)]


class DocumentRenderService:
    @staticmethod
    def render_plain_text(document: OptimizedResumeDocument) -> str:
        parts: list[str] = [document.candidate_name]

        if document.headline:
            parts.append(document.headline)
        if document.contact_line:
            parts.append(document.contact_line)
        if document.summary:
            parts.extend(["", "Summary", document.summary])
        if document.skills:
            parts.extend(["", "Skills", ", ".join(document.skills)])

        for section in document.sections:
            parts.extend(["", section.title])
            parts.extend(f"- {line}" for line in section.lines if _clean_line(line))

        return "\n".join(parts).strip()

    @staticmethod
    def render_latex(document: OptimizedResumeDocument) -> str:
        lines = [
            r"\documentclass[11pt]{article}",
            r"\usepackage[margin=0.7in]{geometry}",
            r"\usepackage[T1]{fontenc}",
            r"\usepackage{enumitem}",
            r"\usepackage[hidelinks]{hyperref}",
            r"\pagestyle{empty}",
            r"\setlength{\parindent}{0pt}",
            r"\begin{document}",
            rf"{{\LARGE \textbf{{{_escape_latex(document.candidate_name)}}}}}\\[4pt]",
        ]

        if document.headline:
            lines.append(rf"{{\large {_escape_latex(document.headline)}}}\\[2pt]")
        if document.contact_line:
            lines.append(rf"{_escape_latex(document.contact_line)}\\[8pt]")

        if document.summary:
            lines.extend(
                [
                    r"\section*{Summary}",
                    _escape_latex(document.summary),
                ]
            )

        if document.skills:
            lines.extend(
                [
                    r"\section*{Skills}",
                    _escape_latex(", ".join(document.skills)),
                ]
            )

        for section in document.sections:
            lines.extend(DocumentRenderService._render_latex_section(section))

        lines.append(r"\end{document}")
        return "\n".join(lines)

    @staticmethod
    def _render_latex_section(section: ResumeSection) -> list[str]:
        rendered = [rf"\section*{{{_escape_latex(section.title)}}}", r"\begin{itemize}[leftmargin=*]"]
        for line in section.lines:
            cleaned = _clean_line(line)
            if cleaned:
                rendered.append(rf"  \item {_escape_latex(cleaned)}")
        rendered.append(r"\end{itemize}")
        return rendered

    @staticmethod
    def write_latex(document: OptimizedResumeDocument, output_path: Path) -> str:
        latex = DocumentRenderService.render_latex(document)
        output_path.write_text(latex, encoding="utf-8")
        return latex

    @staticmethod
    def write_pdf(document: OptimizedResumeDocument, output_path: Path) -> None:
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "ResumeTitle",
            parent=styles["Title"],
            alignment=TA_CENTER,
            textColor=HexColor("#102542"),
            fontSize=18,
            leading=22,
        )
        heading_style = ParagraphStyle(
            "ResumeHeading",
            parent=styles["Heading2"],
            textColor=HexColor("#B23A48"),
            fontSize=12,
            leading=15,
            spaceAfter=6,
        )
        body_style = ParagraphStyle(
            "ResumeBody",
            parent=styles["BodyText"],
            fontSize=10,
            leading=13,
            spaceAfter=4,
        )

        story = [Paragraph(_escape_pdf(document.candidate_name), title_style), Spacer(1, 8)]
        if document.headline:
            story.extend([Paragraph(_escape_pdf(document.headline), styles["BodyText"]), Spacer(1, 4)])
        if document.contact_line:
            story.extend([Paragraph(_escape_pdf(document.contact_line), styles["BodyText"]), Spacer(1, 8)])
        if document.summary:
            story.extend(
                [
                    Paragraph("Summary", heading_style),
                    Paragraph(_escape_pdf(document.summary), body_style),
                    Spacer(1, 6),
                ]
            )
        if document.skills:
            story.extend(
                [
                    Paragraph("Skills", heading_style),
                    Paragraph(_escape_pdf(", ".join(document.skills)), body_style),
                    Spacer(1, 6),
                ]
            )

        for section in document.sections:
            story.append(Paragraph(_escape_pdf(section.title), heading_style))
            for line in section.lines:
                cleaned = _clean_line(line)
                if cleaned:
                    story.append(Paragraph(f"&bull; {_escape_pdf(cleaned)}", body_style))
            story.append(Spacer(1, 6))

        if not _iter_document_lines(document):
            story.append(Paragraph("No content available.", body_style))

        pdf = SimpleDocTemplate(
            str(output_path),
            pagesize=LETTER,
            title=document.candidate_name,
            author=settings.pdf_author,
            leftMargin=40,
            rightMargin=40,
            topMargin=40,
            bottomMargin=40,
        )
        pdf.build(story)
