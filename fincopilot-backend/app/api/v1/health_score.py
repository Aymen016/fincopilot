from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.repositories.expense_repo import ExpenseRepository
from app.repositories.budget_repo import BudgetRepository
from app.repositories.goal_repo import GoalRepository
from app.schemas.health_score import HealthScoreResponse
from app.services.health_score_service import HealthScoreService

router = APIRouter(prefix="/health-score", tags=["health-score"])


def get_service(db: AsyncSession = Depends(get_db)) -> HealthScoreService:
    return HealthScoreService(ExpenseRepository(db), BudgetRepository(db), GoalRepository(db))


@router.get("", response_model=HealthScoreResponse)
async def get_health_score(
    current_user: User = Depends(get_current_user),
    svc: HealthScoreService = Depends(get_service),
):
    return await svc.get_score(current_user.id)
