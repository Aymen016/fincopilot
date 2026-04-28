from uuid import UUID
from datetime import datetime

from app.repositories.budget_repo import BudgetRepository
from app.repositories.expense_repo import ExpenseRepository
from app.schemas.budget import BudgetCreate


class BudgetService:
    def __init__(self, budget_repo: BudgetRepository, expense_repo: ExpenseRepository):
        self.budget_repo = budget_repo
        self.expense_repo = expense_repo

    async def create_or_update(self, user_id: UUID, data: BudgetCreate):
        existing = await self.budget_repo.get_for_category_month(
            user_id, data.category_id, data.month, data.year
        )
        if existing:
            return await self.budget_repo.update(existing.id, {"amount_limit": data.amount_limit})
        return await self.budget_repo.create({
            "user_id": user_id,
            "category_id": data.category_id,
            "amount_limit": data.amount_limit,
            "month": data.month,
            "year": data.year,
        })

    async def list_with_spending(self, user_id: UUID, month: int, year: int) -> list[dict]:
        budgets = await self.budget_repo.list_for_user_month(user_id, month, year)
        totals = await self.expense_repo.get_monthly_totals_by_category(user_id, month, year)
        spending_map = {str(t["category_id"]): t["total"] for t in totals}

        result = []
        for budget in budgets:
            spent = spending_map.get(str(budget.category_id), 0.0)
            percent = (spent / budget.amount_limit * 100) if budget.amount_limit > 0 else 0
            result.append({
                "id": budget.id,
                "category": budget.category,
                "amount_limit": budget.amount_limit,
                "month": budget.month,
                "year": budget.year,
                "spent": spent,
                "percent_used": round(percent, 1),
                "is_over_budget": spent > budget.amount_limit,
            })
        return result

    async def get_alerts(self, user_id: UUID, month: int, year: int) -> list[dict]:
        budgets_with_spending = await self.list_with_spending(user_id, month, year)
        alerts = []
        for b in budgets_with_spending:
            if b["percent_used"] >= 80:
                alerts.append({
                    "category": b["category"],
                    "amount_limit": b["amount_limit"],
                    "spent": b["spent"],
                    "percent_used": b["percent_used"],
                    "risk_level": "high" if b["percent_used"] >= 100 else "medium",
                })
        return sorted(alerts, key=lambda x: x["percent_used"], reverse=True)
