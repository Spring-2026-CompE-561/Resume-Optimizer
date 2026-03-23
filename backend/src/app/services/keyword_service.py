import re
from collections import Counter

from sqlalchemy.orm import Session

from src.app.exceptions.job_posting_exceptions import keyword_extraction_failed_exception
from src.app.models.job_posting_skill import JobPostingSkill
from src.app.models.keyword import Keyword

# Common English stop words to filter out
_STOP_WORDS = {
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "will", "would",
    "could", "should", "may", "might", "shall", "can", "need", "dare",
    "ought", "used", "it", "its", "this", "that", "these", "those", "we",
    "you", "he", "she", "they", "i", "my", "your", "our", "their", "his",
    "her", "as", "if", "so", "than", "then", "when", "where", "who", "which",
    "what", "how", "not", "no", "nor", "up", "out", "about", "into", "through",
    "during", "before", "after", "above", "below", "between", "each", "more",
    "also", "just", "any", "all", "both", "few", "other", "such", "only",
    "own", "same", "too", "very", "s", "t", "re", "ve", "ll", "d", "m",
}

# Known technical skill terms to classify as "skill"
_SKILL_TERMS = {
    "python", "java", "javascript", "typescript", "go", "rust", "c", "c++",
    "sql", "nosql", "postgresql", "mysql", "mongodb", "redis", "sqlite",
    "react", "angular", "vue", "node", "django", "flask", "fastapi", "spring",
    "docker", "kubernetes", "aws", "gcp", "azure", "terraform", "ci", "cd",
    "git", "linux", "rest", "graphql", "grpc", "kafka", "rabbitmq",
    "pandas", "numpy", "pytorch", "tensorflow", "scikit", "ml", "ai",
    "html", "css", "sass", "tailwind", "figma", "agile", "scrum",
}

_TOP_N = 30
_MIN_WORD_LENGTH = 3


def _tokenize(text: str) -> list[str]:
    tokens = re.findall(r"[a-zA-Z][a-zA-Z0-9+#]*", text.lower())
    return [t for t in tokens if len(t) >= _MIN_WORD_LENGTH and t not in _STOP_WORDS]


def _score(term: str, count: int, total: int) -> float:
    base = count / total if total > 0 else 0.0
    boost = 1.5 if term in _SKILL_TERMS else 1.0
    return round(base * boost, 6)


def _categorize(term: str) -> str | None:
    if term in _SKILL_TERMS:
        return "skill"
    return None


def extract_and_persist_keywords(
    db: Session,
    job_posting_id: int,
    description: str,
) -> None:
    """Tokenize description, rank keywords, and persist Keyword and JobPostingSkill rows."""
    try:
        tokens = _tokenize(description)
        if not tokens:
            raise keyword_extraction_failed_exception

        total = len(tokens)
        counts = Counter(tokens)
        top_terms = counts.most_common(_TOP_N)

        for term, count in top_terms:
            score = _score(term, count, total)
            category = _categorize(term)

            keyword = Keyword(
                job_posting_id=job_posting_id,
                term=term,
                category=category,
                significance_score=score,
            )
            db.add(keyword)

            if category == "skill":
                skill = JobPostingSkill(
                    job_posting_id=job_posting_id,
                    skill_name=term,
                )
                db.add(skill)

        db.commit()

    except Exception as exc:
        db.rollback()
        raise keyword_extraction_failed_exception from exc
