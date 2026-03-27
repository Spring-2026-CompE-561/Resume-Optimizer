from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.app.core.database import get_db
from src.app.core.dependencies import CurrentUser
from src.app.schemas.optimize import OptimizationRunOut, OptimizeRequest
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
    )
    return OptimizationRunOut.model_validate(optimization_run)


router = api_router