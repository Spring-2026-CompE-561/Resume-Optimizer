from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from src.app.core.database import get_db
from src.app.core.dependencies import CurrentUser
from src.app.schemas.optimize import (
    OptimizationRunOut,
    OptimizeRequest,
    RegenerateOptimizationRequest,
)
from src.app.services import optimize_service

api_router = APIRouter(prefix="/optimize", tags=["optimize"])


@api_router.post("", response_model=OptimizationRunOut, status_code=201)
def optimize_resume(
    data: OptimizeRequest,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> OptimizationRunOut:
    optimization_run = optimize_service.optimize_resume_for_user(
        db=db,
        user=user,
        resume_id=data.resume_id,
        job_posting_id=data.job_posting_id,
        customization_notes=data.customization_notes,
    )
    return optimize_service.serialize_run(optimization_run)


@api_router.get("", response_model=list[OptimizationRunOut])
def list_optimization_runs(
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> list[OptimizationRunOut]:
    return optimize_service.list_runs_for_user(db=db, user=user)


@api_router.get("/{optimization_run_id}", response_model=OptimizationRunOut)
def get_optimization_run(
    optimization_run_id: int,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> OptimizationRunOut:
    return optimize_service.get_run_for_user(
        db=db,
        user=user,
        optimization_run_id=optimization_run_id,
    )


@api_router.post("/{optimization_run_id}/regenerate", response_model=OptimizationRunOut, status_code=201)
def regenerate_optimization(
    optimization_run_id: int,
    data: RegenerateOptimizationRequest,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> OptimizationRunOut:
    optimization_run = optimize_service.regenerate_for_user(
        db=db,
        user=user,
        optimization_run_id=optimization_run_id,
        customization_notes=data.customization_notes,
    )
    return optimize_service.serialize_run(optimization_run)


@api_router.get("/{optimization_run_id}/pdf")
def download_optimization_pdf(
    optimization_run_id: int,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> FileResponse:
    pdf_path = optimize_service.get_pdf_path_for_user(
        db=db,
        user=user,
        optimization_run_id=optimization_run_id,
    )
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=f"optimized-resume-{optimization_run_id}.pdf",
    )


router = api_router
