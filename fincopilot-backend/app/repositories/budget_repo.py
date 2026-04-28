from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.budget import Budget
from app.repositories.base import BaseRepository


class BudgetRepository(BaseRepository[Budget]):
    def __init__(self, session):
        super().__init__(session, Budget)

    async def list_for_user_month(self, user_id: UUID, month: int, year: int) -> list[Budget]:
        result = await self.session.execute(
            select(Budget)
            .options(selectinload(Budget.category))
            .where(Budget.user_id == user_id, Budget.month == month, Budget.year == year)
        )
        return result.scalars().all()

    async def get_for_category_month(self, user_id: UUID, category_id: UUID, month: int, year: int) -> Budget | None:
        result = await self.session.execute(
            select(Budget).where(
                Budget.user_id == user_id,
                Budget.category_id == category_id,
                Budget.month == month,
                Budget.year == year,
            )
        )
        return result.scalar_one_or_none()
