from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from src.app.core.database import get_db
from src.app.core.dependencies import CurrentUser
from src.app.exceptions.resume_exceptions import resume_not_found_exception
from src.app.models.resume import Resume
from src.app.models.resume_skill import ResumeSkill
from src.app.repository.resume_repository import ResumeRepository
from src.app.schemas.resume import ResumeResponse
from src.app.services.resume_parse_service import ResumeParseService
from src.app.services.resume_skill_service import ResumeSkillService
from src.app.services.resume_upload_service import ResumeUploadService

api_router = APIRouter(prefix="/resumes", tags=["resumes"])


@api_router.post("", response_model=ResumeResponse)
async def upload_resume(
    current_user: CurrentUser,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> ResumeResponse:
    original_file_name, storage_path = await ResumeUploadService.validate_and_store(file)
    parsed_text = ResumeParseService.parse_file(storage_path, file.content_type)

    resume = Resume(
        user_id=current_user.id,
        file_name=original_file_name,
        mime_type=file.content_type,
        storage_path=storage_path,
        parsed_text=parsed_text,
    )
    saved_resume = ResumeRepository.create(db, resume)

    extracted_skills = ResumeSkillService.extract_skills(parsed_text)
    for skill in extracted_skills:
        db.add(
            ResumeSkill(
                resume_id=saved_resume.id,
                skill_name=skill["skill_name"],
                category=skill["category"],
            )
        )
    db.commit()

    return saved_resume


@api_router.get("", response_model=list[ResumeResponse])
def list_resumes(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
) -> list[ResumeResponse]:
    return ResumeRepository.get_all_by_user(db, current_user.id)


@api_router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume(
    resume_id: int,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
) -> ResumeResponse:
    resume = ResumeRepository.get_by_id(db, resume_id)
    if not resume or resume.user_id != current_user.id:
        raise resume_not_found_exception
    return resume


@api_router.delete("/{resume_id}")
def delete_resume(
    resume_id: int,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    resume = ResumeRepository.get_by_id(db, resume_id)
    if not resume or resume.user_id != current_user.id:
        raise resume_not_found_exception

    ResumeRepository.delete(db, resume)
    return {"message": "Resume deleted successfully"}