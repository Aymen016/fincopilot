from uuid import UUID
from datetime import datetime, date
from pydantic import BaseModel


class GoalCreate(BaseModel):
    name: str
    description: str | None = None
    target_amount: float
    target_date: date


class GoalUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    target_amount: float | None = None
    target_date: date | None = None


class GoalDepositRequest(BaseModel):
    amount: float
    note: str | None = None


class GoalResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    target_amount: float
    current_amount: float
    target_date: date
    progress_percent: float
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class GoalPlanResponse(BaseModel):
    goal_id: UUID
    monthly_required: float
    milestones: list[dict]
    suggested_cutbacks: list[dict]
    on_track: bool
