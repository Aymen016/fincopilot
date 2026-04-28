from uuid import UUID
from datetime import date
from app.ai.forecaster import SpendingForecaster
from app.repositories.expense_repo import ExpenseRepository
from app.repositories.budget_repo import BudgetRepository

forecaster = SpendingForecaster()


class ForecastService:
    def __init__(self, expense_repo: ExpenseRepository, budget_repo: BudgetRepository):
        self.expense_repo = expense_repo
        self.budget_repo = budget_repo

    async def monthly_forecast(self, user_id: UUID, target_month: int, target_year: int) -> dict:
        return await forecaster.forecast_month(user_id, target_month, target_year, self.expense_repo)

    async def risk_flags(self, user_id: UUID) -> dict:
        today = date.today()
        forecast = await self.monthly_forecast(user_id, today.month, today.year)
        budgets = await self.budget_repo.list_for_user_month(user_id, today.month, today.year)
        budget_map = {str(b.category_id): b.amount_limit for b in budgets}

        flags = []
        for cat in forecast.get("by_category", []):
            cat_id = cat["category_id"]
            if cat_id in budget_map:
                predicted = cat["predicted_amount"]
                budget = budget_map[cat_id]
                if predicted > budget * 0.85:
                    flags.append({
                        "category_id": cat_id,
                        "category_name": cat["category_name"],
                        "predicted": predicted,
                        "budget": budget,
                        "risk_level": "high" if predicted > budget * 1.1 else "medium",
                        "overspend_by": max(0.0, predicted - budget),
                    })
        return {"risk_flags": flags}
