from uuid import UUID
from pydantic import BaseModel


class CategoryResponse(BaseModel):
    id: UUID
    name: str
    icon: str
    color: str
    is_system: bool

    model_config = {"from_attributes": True}
