from uuid import UUID
from datetime import date
import pandas as pd


class SpendingForecaster:
    async def forecast_month(self, user_id: UUID, target_month: int, target_year: int, expense_repo) -> dict:
        # Load 12 months of history
        from datetime import datetime, timedelta
        end_date = date(target_year, target_month, 1) - timedelta(days=1)
        start_date = date(end_date.year - 1, end_date.month, 1)

        history = await expense_repo.list_for_user(
            user_id, offset=0, limit=10000,
            date_from=start_date, date_to=end_date,
        )
        expenses, _ = history if isinstance(history, tuple) else (history, 0)

        if not expenses:
            return {
                "month": target_month, "year": target_year,
                "total_predicted": 0.0, "by_category": [],
            }

        df = pd.DataFrame([{
            "category_id": str(e.category_id),
            "amount": e.amount,
            "date": e.expense_date,
        } for e in expenses])

        by_category = df.groupby("category_id")["amount"].mean().to_dict()
        total = sum(by_category.values())

        # Build category name map from loaded expenses
        cat_names = {str(e.category_id): e.category.name if hasattr(e, 'category') and e.category else "Unknown"
                     for e in expenses}

        result_cats = [
            {
                "category_id": cat_id,
                "category_name": cat_names.get(cat_id, "Unknown"),
                "predicted_amount": round(avg, 2),
                "budget_amount": None,
            }
            for cat_id, avg in by_category.items()
        ]
        result_cats.sort(key=lambda x: x["predicted_amount"], reverse=True)

        return {
            "month": target_month,
            "year": target_year,
            "total_predicted": round(total, 2),
            "by_category": result_cats,
        }
