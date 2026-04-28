from uuid import UUID
from sqlalchemy import select
from app.models.goal import SavingsGoal, GoalContribution
from app.repositories.base import BaseRepository


class GoalRepository(BaseRepository[SavingsGoal]):
    def __init__(self, session):
        super().__init__(session, SavingsGoal)

    async def list_active_for_user(self, user_id: UUID) -> list[SavingsGoal]:
        result = await self.session.execute(
            select(SavingsGoal).where(SavingsGoal.user_id == user_id, SavingsGoal.is_active == True)
        )
        return result.scalars().all()

    async def add_contribution(self, goal_id: UUID, amount: float, note: str | None) -> GoalContribution:
        contribution = GoalContribution(goal_id=goal_id, amount=amount, note=note)
        self.session.add(contribution)

        goal = await self.get(goal_id)
        await self.update(goal_id, {"current_amount": goal.current_amount + amount})
        await self.session.flush()
        return contribution
