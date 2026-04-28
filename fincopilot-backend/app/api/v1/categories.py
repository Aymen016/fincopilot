from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.category import Category
from app.schemas.category import CategoryResponse
from app.schemas.expense import CategoryCorrectionRequest
from app.repositories.expense_repo import ExpenseRepository
from app.services.expense_service import ExpenseService

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryResponse])
async def list_categories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Category).where(
            (Category.is_system == True) | (Category.user_id == current_user.id)
        )
    )
    return result.scalars().all()


@router.post("/correct")
async def correct_category(
    data: CategoryCorrectionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    svc = ExpenseService(ExpenseRepository(db))
    expense = await svc.correct_category(current_user.id, data.expense_id, data.correct_category_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Category corrected", "expense_id": str(data.expense_id)}
