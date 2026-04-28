from uuid import UUID
from app.ai.health_scorer import HealthScorer
from app.repositories.expense_repo import ExpenseRepository
from app.repositories.budget_repo import BudgetRepository
from app.repositories.goal_repo import GoalRepository

scorer = HealthScorer()


class HealthScoreService:
    def __init__(self, expense_repo: ExpenseRepository, budget_repo: BudgetRepository, goal_repo: GoalRepository):
        self.expense_repo = expense_repo
        self.budget_repo = budget_repo
        self.goal_repo = goal_repo

    async def get_score(self, user_id: UUID) -> dict:
        return await scorer.score(user_id, self.expense_repo, self.budget_repo, self.goal_repo)
