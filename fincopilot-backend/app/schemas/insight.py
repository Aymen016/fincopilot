from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class InsightResponse(BaseModel):
    id: UUID
    type: str
    severity: str
    title: str
    body: str
    is_dismissed: bool
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
