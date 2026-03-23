from datetime import datetime

from pydantic import BaseModel

class ResumeResponse(BaseModel):
    id: int
    user_id: int
    file_name: str
    mime_type: str
    storage_path: str
    parsed_text: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
