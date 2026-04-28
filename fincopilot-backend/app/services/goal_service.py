from uuid import UUID
from datetime import date

from app.repositories.goal_repo import GoalRepository
from app.schemas.goal import GoalCreate


class GoalService:
    def __init__(self, repo: GoalRepository):
        self.repo = repo

    async def create(self, user_id: UUID, data: GoalCreate):
        goal = await self.repo.create({
            "user_id": user_id,
            "name": data.name,
            "description": data.description,
            "target_amount": data.target_amount,
            "current_amount": 0.0,
            "target_date": data.target_date,
        })
        return self._enrich(goal)

    async def list(self, user_id: UUID) -> list[dict]:
        goals = await self.repo.list_active_for_user(user_id)
        return [self._enrich(g) for g in goals]

    async def deposit(self, user_id: UUID, goal_id: UUID, amount: float, note: str | None):
        goal = await self.repo.get(goal_id)
        if not goal or goal.user_id != user_id:
            return None
        await self.repo.add_contribution(goal_id, amount, note)
        updated = await self.repo.get(goal_id)
        return self._enrich(updated)

    async def get_plan(self, user_id: UUID, goal_id: UUID) -> dict | None:
        goal = await self.repo.get(goal_id)
        if not goal or goal.user_id != user_id:
            return None
        if goal.ai_plan:
            return {"goal_id": goal_id, **goal.ai_plan}
        return self._generate_basic_plan(goal)

    def _enrich(self, goal) -> dict:
        progress = (goal.current_amount / goal.target_amount * 100) if goal.target_amount > 0 else 0
        return {
            "id": goal.id,
            "name": goal.name,
            "description": goal.description,
            "target_amount": goal.target_amount,
            "current_amount": goal.current_amount,
            "target_date": goal.target_date,
            "progress_percent": round(min(progress, 100), 1),
            "is_active": goal.is_active,
            "created_at": goal.created_at,
        }

    def _generate_basic_plan(self, goal) -> dict:
        remaining = goal.target_amount - goal.current_amount
        today = date.today()
        months_left = max(1, (goal.target_date.year - today.year) * 12 + (goal.target_date.month - today.month))
        monthly_required = remaining / months_left
        return {
            "goal_id": goal.id,
            "monthly_required": round(monthly_required, 2),
            "milestones": [
                {"month": i, "target": round(goal.current_amount + monthly_required * i, 2)}
                for i in range(1, min(months_left + 1, 13))
            ],
            "suggested_cutbacks": [],
            "on_track": goal.current_amount >= (goal.target_amount * (1 - months_left / max(months_left, 1))),
        }
