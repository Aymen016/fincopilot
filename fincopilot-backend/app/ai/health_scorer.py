from uuid import UUID
from datetime import datetime, date
import statistics


GRADES = [(90, "A+"), (80, "A"), (70, "B"), (60, "C"), (50, "D"), (0, "F")]


class HealthScorer:
    async def score(self, user_id: UUID, expense_repo, budget_repo, goal_repo) -> dict:
        now = datetime.now()

        # Gather 3 months of data
        monthly_totals = []
        for i in range(3):
            month = ((now.month - 1 - i) % 12) + 1
            year = now.year if now.month > i else now.year - 1
            totals = await expense_repo.get_monthly_totals_by_category(user_id, month, year)
            monthly_totals.append(sum(t["total"] for t in totals))

        avg_monthly = statistics.mean(monthly_totals) if monthly_totals else 0
        monthly_std = statistics.stdev(monthly_totals) if len(monthly_totals) > 1 else 0

        # Savings rate estimate (assume income ~ 1.3x avg spend)
        estimated_income = avg_monthly * 1.3 if avg_monthly > 0 else 1
        savings = estimated_income - avg_monthly
        savings_rate = max(0.0, savings / estimated_income)
        savings_pts = min(30.0, savings_rate / 0.20 * 30)

        # Budget adherence
        budgets = await budget_repo.list_for_user_month(user_id, now.month, now.year)
        totals_this_month = {
            str(t["category_id"]): t["total"]
            for t in await expense_repo.get_monthly_totals_by_category(user_id, now.month, now.year)
        }
        if budgets:
            adherent = sum(1 for b in budgets if totals_this_month.get(str(b.category_id), 0) <= b.amount_limit)
            adherence_rate = adherent / len(budgets)
        else:
            adherence_rate = 0.75  # default when no budgets set
        budget_pts = adherence_rate * 30

        # Consistency (lower std = more consistent)
        if avg_monthly > 0:
            cv = monthly_std / avg_monthly
            consistency_pts = max(0.0, 20.0 - cv * 20.0)
        else:
            consistency_pts = 10.0

        # Goal progress
        goals = await goal_repo.list_active_for_user(user_id)
        if goals:
            avg_progress = sum(
                min(1.0, g.current_amount / g.target_amount) for g in goals
            ) / len(goals)
        else:
            avg_progress = 0.0
        goal_pts = avg_progress * 20

        total = round(savings_pts + budget_pts + consistency_pts + goal_pts)

        # Trend (compare to prior calculation — simplified)
        trend = "+0 vs last month"

        return {
            "score": total,
            "grade": self._grade(total),
            "breakdown": {
                "savings_rate": {"value": round(savings_rate, 2), "score": round(savings_pts, 1), "max": 30},
                "budget_adherence": {"value": round(adherence_rate, 2), "score": round(budget_pts, 1), "max": 30},
                "consistency": {"value": round(1 - (monthly_std / max(avg_monthly, 1)), 2), "score": round(consistency_pts, 1), "max": 20},
                "goal_progress": {"value": round(avg_progress, 2), "score": round(goal_pts, 1), "max": 20},
            },
            "trend": trend,
        }

    def _grade(self, score: int) -> str:
        for threshold, grade in GRADES:
            if score >= threshold:
                return grade
        return "F"
