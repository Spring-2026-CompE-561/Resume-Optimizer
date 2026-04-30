# After await file.read(), the file stream is consumed.
# Later services should use the saved file path, NOT the original file object.

import os
from uuid import uuid4

from fastapi import UploadFile

from src.app.core.settings import settings
from src.app.exceptions.resume_exceptions import (
    file_too_large_exception,
    file_type_unsupported_exception,
)

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


class ResumeUploadService:
    @staticmethod
    async def validate_and_store(file: UploadFile) -> tuple[str, str]:
        # Validate MIME type
        if file.content_type not in ALLOWED_MIME_TYPES:
            raise file_type_unsupported_exception

        contents = await file.read()

        # Validate file size
        if len(contents) > MAX_FILE_SIZE:
            raise file_too_large_exception

        # Generate unique filename
        file_extension = file.filename.split(".")[-1]
        unique_name = f"{uuid4()}.{file_extension}"

        upload_dir = os.path.join(settings.storage_root, "uploads")
        os.makedirs(upload_dir, exist_ok=True)

        file_path = os.path.join(upload_dir, unique_name)

        # Save file
        with open(file_path, "wb") as f:
            f.write(contents)

        return file.filename, file_path
