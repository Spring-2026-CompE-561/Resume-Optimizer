from sqlalchemy import func, select
from sqlalchemy.orm import Session

from src.app.models.optimization_run import OptimizationRun


class OptimizationRepository:
    @staticmethod
    def create(
        db: Session,
        *,
        user_id: int,
        resume_id: int | None,
        job_posting_id: int | None,
        optimized_resume_text: str,
        latex_content: str,
        suggestions: list[str],
        job_keywords: list[str],
        customization_notes: str | None,
        resume_plaintext_snapshot: str,
        job_description_snapshot: str,
        target_job_title: str | None,
        target_company: str | None,
        pdf_path: str | None,
        provider_name: str | None = None,
        latency_ms: int | None = None,
    ) -> OptimizationRun:
        optimization_run = OptimizationRun(
            user_id=user_id,
            resume_id=resume_id,
            job_posting_id=job_posting_id,
            optimized_resume_text=optimized_resume_text,
            latex_content=latex_content,
            suggestions=suggestions,
            job_keywords=job_keywords,
            customization_notes=customization_notes,
            resume_plaintext_snapshot=resume_plaintext_snapshot,
            job_description_snapshot=job_description_snapshot,
            target_job_title=target_job_title,
            target_company=target_company,
            pdf_path=pdf_path,
            provider_name=provider_name,
            latency_ms=latency_ms,
        )
        db.add(optimization_run)
        db.commit()
        db.refresh(optimization_run)
        return optimization_run

    @staticmethod
    def get_by_id(db: Session, optimization_run_id: int) -> OptimizationRun | None:
        return db.scalars(
            select(OptimizationRun).where(OptimizationRun.id == optimization_run_id)
        ).first()

    @staticmethod
    def get_all_by_user(db: Session, user_id: int) -> list[OptimizationRun]:
        return list(
            db.scalars(
                select(OptimizationRun)
                .where(OptimizationRun.user_id == user_id)
                .order_by(OptimizationRun.created_at.desc(), OptimizationRun.id.desc())
            ).all()
        )

    @staticmethod
    def get_page_by_user(
        db: Session,
        user_id: int,
        *,
        offset: int,
        limit: int,
    ) -> list[OptimizationRun]:
        return list(
            db.scalars(
                select(OptimizationRun)
                .where(OptimizationRun.user_id == user_id)
                .order_by(OptimizationRun.created_at.desc(), OptimizationRun.id.desc())
                .offset(offset)
                .limit(limit)
            ).all()
        )

    @staticmethod
    def count_by_user(db: Session, user_id: int) -> int:
        return db.scalar(
            select(func.count()).select_from(OptimizationRun).where(OptimizationRun.user_id == user_id)
        ) or 0

    @staticmethod
    def delete(db: Session, optimization_run: OptimizationRun) -> None:
        db.delete(optimization_run)
        db.commit()
