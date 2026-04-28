from uuid import UUID
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel, field_validator
from app.schemas.category import CategoryResponse


class ExpenseCreate(BaseModel):
    amount: Decimal
    description: str
    merchant: str | None = None
    expense_date: date
    category_id: UUID | None = None

    @field_validator("amount")
    @classmethod
    def amount_must_be_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Amount must be positive")
        return v


class ExpenseUpdate(BaseModel):
    amount: Decimal | None = None
    description: str | None = None
    merchant: str | None = None
    expense_date: date | None = None
    category_id: UUID | None = None


class ExpenseResponse(BaseModel):
    id: UUID
    amount: float
    description: str
    merchant: str | None
    expense_date: date
    category: CategoryResponse
    ai_confidence: float
    is_corrected: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class CategoryCorrectionRequest(BaseModel):
    expense_id: UUID
    correct_category_id: UUID


class BulkUploadResponse(BaseModel):
    job_id: str
    status: str


class JobStatusResponse(BaseModel):
    status: str
    progress: int
    created: int = 0
    failed: int = 0
    errors: list[str] = []
