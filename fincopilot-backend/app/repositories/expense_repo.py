from uuid import UUID
from datetime import date
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from app.models.expense import Expense, CategoryCorrection
from app.repositories.base import BaseRepository


class ExpenseRepository(BaseRepository[Expense]):
    def __init__(self, session):
        super().__init__(session, Expense)

    async def list_for_user(
        self,
        user_id: UUID,
        offset: int = 0,
        limit: int = 20,
        date_from: date | None = None,
        date_to: date | None = None,
        category_id: UUID | None = None,
    ) -> tuple[list[Expense], int]:
        query = (
            select(Expense)
            .options(selectinload(Expense.category))
            .where(Expense.user_id == user_id)
        )
        count_query = select(func.count()).select_from(Expense).where(Expense.user_id == user_id)

        if date_from:
            query = query.where(Expense.expense_date >= date_from)
            count_query = count_query.where(Expense.expense_date >= date_from)
        if date_to:
            query = query.where(Expense.expense_date <= date_to)
            count_query = count_query.where(Expense.expense_date <= date_to)
        if category_id:
            query = query.where(Expense.category_id == category_id)
            count_query = count_query.where(Expense.category_id == category_id)

        query = query.order_by(Expense.expense_date.desc()).offset(offset).limit(limit)
        result = await self.session.execute(query)
        count_result = await self.session.execute(count_query)
        return result.scalars().all(), count_result.scalar()

    async def get_with_category(self, id: UUID) -> Expense | None:
        result = await self.session.execute(
            select(Expense).options(selectinload(Expense.category)).where(Expense.id == id)
        )
        return result.scalar_one_or_none()

    async def get_monthly_totals_by_category(self, user_id: UUID, month: int, year: int) -> list[dict]:
        result = await self.session.execute(
            select(
                Expense.category_id,
                func.sum(Expense.amount).label("total"),
            )
            .where(
                and_(
                    Expense.user_id == user_id,
                    func.extract("month", Expense.expense_date) == month,
                    func.extract("year", Expense.expense_date) == year,
                )
            )
            .group_by(Expense.category_id)
        )
        return [{"category_id": row.category_id, "total": row.total} for row in result.all()]

    async def save_correction(self, correction: CategoryCorrection) -> None:
        self.session.add(correction)
        await self.session.flush()

    async def get_corrections_for_training(self, min_count: int = 50) -> list[CategoryCorrection]:
        result = await self.session.execute(select(CategoryCorrection))
        return result.scalars().all()

    async def bulk_create(self, expenses: list[dict]) -> int:
        objs = [Expense(**e) for e in expenses]
        self.session.add_all(objs)
        await self.session.flush()
        return len(objs)
