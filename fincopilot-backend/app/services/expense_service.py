from uuid import UUID
from datetime import date
from sqlalchemy import select

from app.models.category import Category
from app.models.expense import CategoryCorrection
from app.repositories.expense_repo import ExpenseRepository
from app.schemas.expense import ExpenseCreate, ExpenseUpdate


class ExpenseService:
    def __init__(self, repo: ExpenseRepository):
        self.repo = repo

    async def _fallback_category_id(self) -> UUID | None:
        """Return the 'Other' system category UUID as a safe fallback."""
        result = await self.repo.session.execute(
            select(Category).where(Category.is_system == True, Category.name == "Other")
        )
        cat = result.scalar_one_or_none()
        return cat.id if cat else None

    async def create(self, user_id: UUID, data: ExpenseCreate):
        category_id = data.category_id

        if not category_id:
            category_id = await self._fallback_category_id()

        expense = await self.repo.create({
            "user_id": user_id,
            "category_id": category_id,
            "amount": float(data.amount),
            "description": data.description,
            "merchant": data.merchant,
            "expense_date": data.expense_date,
            "ai_confidence": 1.0,
            "is_corrected": False,
        })
        return await self.repo.get_with_category(expense.id)

    async def list(self, user_id: UUID, offset: int, limit: int,
                   date_from: date | None, date_to: date | None, category_id: UUID | None):
        return await self.repo.list_for_user(user_id, offset, limit, date_from, date_to, category_id)

    async def update(self, user_id: UUID, expense_id: UUID, data: ExpenseUpdate):
        expense = await self.repo.get_with_category(expense_id)
        if not expense or expense.user_id != user_id:
            return None

        update_data = data.model_dump(exclude_none=True)
        await self.repo.update(expense_id, update_data)
        return await self.repo.get_with_category(expense_id)

    async def delete(self, user_id: UUID, expense_id: UUID) -> bool:
        expense = await self.repo.get(expense_id)
        if not expense or expense.user_id != user_id:
            return False
        return await self.repo.delete(expense_id)

    async def correct_category(self, user_id: UUID, expense_id: UUID, new_category_id: UUID):
        expense = await self.repo.get_with_category(expense_id)
        if not expense or expense.user_id != user_id:
            return None

        old_category_id = expense.category_id
        await self.repo.update(expense_id, {"category_id": new_category_id, "is_corrected": True})

        correction = CategoryCorrection(
            user_id=user_id,
            expense_id=expense_id,
            old_category_id=old_category_id,
            new_category_id=new_category_id,
            original_description=expense.description,
        )
        await self.repo.save_correction(correction)
        return await self.repo.get_with_category(expense_id)
