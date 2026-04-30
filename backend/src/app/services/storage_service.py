from pathlib import Path
from uuid import uuid4

from src.app.core.settings import settings


class StorageService:
    @staticmethod
    def ensure_directory(*parts: str) -> Path:
        directory = Path(settings.storage_root).joinpath(*parts)
        directory.mkdir(parents=True, exist_ok=True)
        return directory

    @staticmethod
    def new_optimization_artifact_paths() -> tuple[Path, Path, Path]:
        artifact_dir = StorageService.ensure_directory("optimized", uuid4().hex)
        return artifact_dir, artifact_dir / "resume.tex", artifact_dir / "resume.pdf"
