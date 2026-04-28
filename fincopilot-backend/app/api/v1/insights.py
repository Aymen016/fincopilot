from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.repositories.insight_repo import InsightRepository
from app.repositories.expense_repo import ExpenseRepository
from app.repositories.budget_repo import BudgetRepository
from app.repositories.goal_repo import GoalRepository
from app.schemas.insight import InsightResponse
from app.services.insight_service import InsightService

router = APIRouter(prefix="/insights", tags=["insights"])


def get_service(db: AsyncSession = Depends(get_db)) -> InsightService:
    return InsightService(
        InsightRepository(db),
        ExpenseRepository(db),
        BudgetRepository(db),
        GoalRepository(db),
    )


@router.get("", response_model=list[InsightResponse])
async def list_insights(
    current_user: User = Depends(get_current_user),
    svc: InsightService = Depends(get_service),
):
    return await svc.list(current_user.id, current_user.monthly_income)


@router.post("/{insight_id}/dismiss", status_code=204)
async def dismiss_insight(
    insight_id: UUID,
    current_user: User = Depends(get_current_user),
    svc: InsightService = Depends(get_service),
):
    ok = await svc.dismiss(current_user.id, insight_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Insight not found")


@router.post("/{insight_id}/read", status_code=204)
async def mark_read(
    insight_id: UUID,
    current_user: User = Depends(get_current_user),
    svc: InsightService = Depends(get_service),
):
    ok = await svc.mark_read(current_user.id, insight_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Insight not found")
