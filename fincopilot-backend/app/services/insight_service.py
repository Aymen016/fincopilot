from uuid import UUID
from datetime import date, timedelta, datetime, timezone
from collections import defaultdict
from sqlalchemy import delete

INSIGHT_TTL_SECONDS = 3600  # recompute at most once per hour

from app.repositories.insight_repo import InsightRepository
from app.repositories.expense_repo import ExpenseRepository
from app.repositories.budget_repo import BudgetRepository
from app.repositories.goal_repo import GoalRepository
from app.ai.insights_engine import InsightsEngine, UserStats
from app.models.insight import Insight, InsightType, InsightSeverity

engine = InsightsEngine()


class InsightService:
    def __init__(
        self,
        repo: InsightRepository,
        expense_repo: ExpenseRepository,
        budget_repo: BudgetRepository,
        goal_repo: GoalRepository,
    ):
        self.repo = repo
        self.expense_repo = expense_repo
        self.budget_repo = budget_repo
        self.goal_repo = goal_repo

    async def list(self, user_id: UUID, monthly_income: float | None = None) -> list:
        await self._refresh_insights(user_id, monthly_income)
        return await self.repo.list_for_user(user_id)

    async def dismiss(self, user_id: UUID, insight_id: UUID) -> bool:
        insight = await self.repo.get(insight_id)
        if not insight or insight.user_id != user_id:
            return False
        await self.repo.update(insight_id, {"is_dismissed": True})
        return True

    async def mark_read(self, user_id: UUID, insight_id: UUID) -> bool:
        insight = await self.repo.get(insight_id)
        if not insight or insight.user_id != user_id:
            return False
        await self.repo.update(insight_id, {"is_read": True})
        return True

    async def _is_stale(self, user_id: UUID) -> bool:
        latest = await self.repo.get_latest_for_user(user_id)
        if not latest:
            return True
        created = latest.created_at
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        age = (datetime.now(timezone.utc) - created).total_seconds()
        return age > INSIGHT_TTL_SECONDS

    async def _refresh_insights(self, user_id: UUID, monthly_income: float | None) -> None:
        if not await self._is_stale(user_id):
            return  # insights are fresh — skip expensive recompute

        await self.repo.session.execute(
            delete(Insight).where(
                Insight.user_id == user_id,
                Insight.is_dismissed == False,
            )
        )
        stats = await self._compute_stats(user_id, monthly_income)
        new_insights = engine.generate(stats)
        for data in new_insights:
            self.repo.session.add(Insight(
                user_id=user_id,
                type=InsightType(data["type"]),
                severity=InsightSeverity(data["severity"]),
                title=data["title"],
                body=data["body"],
            ))
        await self.repo.session.flush()

    async def _compute_stats(self, user_id: UUID, monthly_income: float | None) -> UserStats:
        now = date.today()
        date_from = now - timedelta(days=90)

        expenses, _ = await self.expense_repo.list_for_user(
            user_id, offset=0, limit=5000, date_from=date_from
        )

        if not expenses:
            return UserStats()

        total_all = sum(e.amount for e in expenses)

        # Monthly totals
        monthly: dict[tuple, float] = defaultdict(float)
        for e in expenses:
            key = (e.expense_date.year, e.expense_date.month)
            monthly[key] += e.amount
        monthly_totals = [v for _, v in sorted(monthly.items())]
        current_month_total = monthly.get((now.year, now.month), 0.0)

        # Dining %
        dining_amount = sum(
            e.amount for e in expenses
            if e.category and (
                "dining" in e.category.name.lower()
                or "coffee" in e.category.name.lower()
                or "food" in e.category.name.lower()
                or "outing" in e.category.name.lower()
            )
        )
        dining_pct = dining_amount / total_all if total_all > 0 else 0.0

        # Savings rate
        income = monthly_income or (current_month_total * 1.4 if current_month_total > 0 else 1.0)
        savings_rate = max(0.0, (income - current_month_total) / income)

        # Weekend vs weekday
        weekend = [e for e in expenses if e.expense_date.weekday() >= 5]
        weekday = [e for e in expenses if e.expense_date.weekday() < 5]
        weekend_days = len({e.expense_date for e in weekend}) or 1
        weekday_days = len({e.expense_date for e in weekday}) or 1
        weekend_avg = sum(e.amount for e in weekend) / weekend_days
        weekday_avg = sum(e.amount for e in weekday) / weekday_days
        wvw = weekend_avg / weekday_avg if weekday_avg > 0 else 1.0

        # Recurring charges — same description appearing in 2+ distinct calendar months
        desc_months: dict[str, set] = defaultdict(set)
        desc_amounts: dict[str, list] = defaultdict(list)
        for e in expenses:
            key = (e.description or "").lower().strip()
            if key:
                desc_months[key].add((e.expense_date.year, e.expense_date.month))
                desc_amounts[key].append(e.amount)
        recur_items = [
            key for key in desc_months
            if len(desc_months[key]) >= 2
        ]
        recurring_amount = sum(
            sum(desc_amounts[k]) / len(desc_amounts[k]) for k in recur_items
        )

        # Budget adherence
        budgets = await self.budget_repo.list_for_user_month(user_id, now.month, now.year)
        cat_month = await self.expense_repo.get_monthly_totals_by_category(user_id, now.month, now.year)
        cat_map = {str(t["category_id"]): t["total"] for t in cat_month}
        if budgets:
            over = [b for b in budgets if cat_map.get(str(b.category_id), 0) > b.amount_limit]
            adherent = len(budgets) - len(over)
            budget_adherence = adherent / len(budgets)
            budget_overspend = len(over) > 0
            budget_overspend_cats_str = ", ".join(
                b.category.name for b in over if b.category
            )
        else:
            budget_adherence = 1.0
            budget_overspend = False
            budget_overspend_cats_str = ""

        # Spending trend (compare oldest month to newest month in history)
        spending_trending_up = False
        monthly_increase_pct = 0.0
        if len(monthly_totals) >= 2:
            first, last = monthly_totals[0], monthly_totals[-1]
            if first > 0:
                monthly_increase_pct = (last - first) / first
                spending_trending_up = monthly_increase_pct > 0.1

        return UserStats(
            dining_pct=dining_pct,
            savings_rate=savings_rate,
            weekend_vs_weekday=wvw,
            recurring_detected=len(recur_items) > 0,
            recurring_count=len(recur_items),
            recurring_amount=recurring_amount,
            monthly_totals=monthly_totals,
            budget_adherence=budget_adherence,
            top_category_name="Other",
            top_category_delta=0.0,
            budget_overspend=budget_overspend,
            budget_overspend_cats_str=budget_overspend_cats_str,
            spending_trending_up=spending_trending_up,
            monthly_increase_pct=monthly_increase_pct,
        )
