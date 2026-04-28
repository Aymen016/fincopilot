from uuid import UUID
from pydantic import BaseModel
from app.schemas.category import CategoryResponse


class BudgetCreate(BaseModel):
    category_id: UUID
    amount_limit: float
    month: int
    year: int


class BudgetResponse(BaseModel):
    id: UUID
    category: CategoryResponse
    amount_limit: float
    month: int
    year: int
    spent: float = 0.0
    percent_used: float = 0.0
    is_over_budget: bool = False

    model_config = {"from_attributes": True}


class BudgetAlertResponse(BaseModel):
    category: CategoryResponse
    amount_limit: float
    spent: float
    percent_used: float
    risk_level: str
