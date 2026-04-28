from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.repositories.expense_repo import ExpenseRepository
from app.repositories.budget_repo import BudgetRepository
from app.schemas.forecast import MonthlyForecastResponse, ForecastRiskResponse
from app.services.forecast_service import ForecastService

router = APIRouter(prefix="/forecast", tags=["forecast"])


def get_service(db: AsyncSession = Depends(get_db)) -> ForecastService:
    return ForecastService(ExpenseRepository(db), BudgetRepository(db))


@router.get("/monthly", response_model=MonthlyForecastResponse)
async def monthly_forecast(
    month: int = Query(default=None),
    year: int = Query(default=None),
    current_user: User = Depends(get_current_user),
    svc: ForecastService = Depends(get_service),
):
    now = datetime.now()
    target_month = month or (now.month % 12 + 1)
    target_year = year or (now.year + (1 if now.month == 12 else 0))
    return await svc.monthly_forecast(current_user.id, target_month, target_year)


@router.get("/risk", response_model=ForecastRiskResponse)
async def forecast_risk(
    current_user: User = Depends(get_current_user),
    svc: ForecastService = Depends(get_service),
):
    return await svc.risk_flags(current_user.id)
