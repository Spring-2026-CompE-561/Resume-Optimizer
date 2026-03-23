import os
import re

import pdfplumber
from docx import Document

from src.app.exceptions.resume_exceptions import resume_parse_failed_exception


class ResumeParseService:
    @staticmethod
    def normalize_text(text: str) -> str:
        text = re.sub(r"\r\n|\r", "\n", text)
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()

    @staticmethod
    def parse_pdf(file_path: str) -> str:
        try:
            extracted_pages: list[str] = []

            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text() or ""
                    extracted_pages.append(page_text)

            return ResumeParseService.normalize_text("\n".join(extracted_pages))
        except Exception:
            raise resume_parse_failed_exception

    @staticmethod
    def parse_docx(file_path: str) -> str:
        try:
            document = Document(file_path)
            paragraphs = [paragraph.text for paragraph in document.paragraphs]
            return ResumeParseService.normalize_text("\n".join(paragraphs))
        except Exception:
            raise resume_parse_failed_exception

    @staticmethod
    def parse_file(file_path: str, mime_type: str) -> str:
        if not os.path.exists(file_path):
            raise resume_parse_failed_exception

        if mime_type == "application/pdf":
            return ResumeParseService.parse_pdf(file_path)

        if mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            return ResumeParseService.parse_docx(file_path)

        raise resume_parse_failed_exception