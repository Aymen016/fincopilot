from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.repositories.budget_repo import BudgetRepository
from app.repositories.expense_repo import ExpenseRepository
from app.schemas.budget import BudgetCreate, BudgetResponse, BudgetAlertResponse
from app.services.budget_service import BudgetService

router = APIRouter(prefix="/budgets", tags=["budgets"])


def get_service(db: AsyncSession = Depends(get_db)) -> BudgetService:
    return BudgetService(BudgetRepository(db), ExpenseRepository(db))


@router.get("", response_model=list[BudgetResponse])
async def list_budgets(
    current_user: User = Depends(get_current_user),
    svc: BudgetService = Depends(get_service),
):
    now = datetime.now()
    budgets = await svc.list_with_spending(current_user.id, now.month, now.year)
    return [BudgetResponse(**b) for b in budgets]


@router.post("", response_model=BudgetResponse, status_code=201)
async def create_budget(
    data: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    svc: BudgetService = Depends(get_service),
):
    budget = await svc.create_or_update(current_user.id, data)
    # Re-fetch with spending
    budgets = await svc.list_with_spending(current_user.id, data.month, data.year)
    for b in budgets:
        if b["id"] == budget.id:
            return BudgetResponse(**b)
    return BudgetResponse(
        id=budget.id, category=budget.category,
        amount_limit=budget.amount_limit, month=budget.month, year=budget.year,
    )


@router.delete("/{budget_id}", status_code=204)
async def delete_budget(
    budget_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    svc: BudgetService = Depends(get_service),
):
    from app.repositories.budget_repo import BudgetRepository
    repo = BudgetRepository(db)
    budget = await repo.get(budget_id)
    if not budget or budget.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Budget not found")
    await repo.delete(budget_id)


@router.get("/alerts", response_model=list[BudgetAlertResponse])
async def get_alerts(
    current_user: User = Depends(get_current_user),
    svc: BudgetService = Depends(get_service),
):
    now = datetime.now()
    alerts = await svc.get_alerts(current_user.id, now.month, now.year)
    return [BudgetAlertResponse(**a) for a in alerts]
