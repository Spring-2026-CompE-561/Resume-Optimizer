from sqlalchemy import select
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
        suggestions: list[str],
        provider_name: str | None = None,
        latency_ms: int | None = None,
    ) -> OptimizationRun:
        optimization_run = OptimizationRun(
            user_id=user_id,
            resume_id=resume_id,
            job_posting_id=job_posting_id,
            optimized_resume_text=optimized_resume_text,
            suggestions=suggestions,
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
                .order_by(OptimizationRun.created_at.desc())
            ).all()
        )