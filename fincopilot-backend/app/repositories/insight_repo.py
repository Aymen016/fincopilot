from uuid import UUID
from sqlalchemy import select, delete
from app.models.insight import Insight
from app.repositories.base import BaseRepository


class InsightRepository(BaseRepository[Insight]):
    def __init__(self, session):
        super().__init__(session, Insight)

    async def get_latest_for_user(self, user_id: UUID) -> Insight | None:
        result = await self.session.execute(
            select(Insight)
            .where(Insight.user_id == user_id, Insight.is_dismissed == False)
            .order_by(Insight.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def list_for_user(self, user_id: UUID, include_dismissed: bool = False) -> list[Insight]:
        query = select(Insight).where(Insight.user_id == user_id)
        if not include_dismissed:
            query = query.where(Insight.is_dismissed == False)
        query = query.order_by(Insight.created_at.desc())
        result = await self.session.execute(query)
        return result.scalars().all()

    async def invalidate_for_user(self, user_id: UUID) -> None:
        """Delete cached insights so next GET forces a recompute."""
        await self.session.execute(
            delete(Insight).where(Insight.user_id == user_id, Insight.is_dismissed == False)
        )

    async def bulk_create(self, insights: list[dict]) -> list[Insight]:
        objs = [Insight(**i) for i in insights]
        self.session.add_all(objs)
        await self.session.flush()
        return objs
