import asyncio
from app.tasks.celery_app import celery_app


@celery_app.task(name="app.tasks.alert_budgets.check_all_budget_alerts")
def check_all_budget_alerts():
    asyncio.run(_check_alerts())


async def _check_alerts():
    from app.database import AsyncSessionLocal
    from sqlalchemy import select
    from app.models.user import User
    from app.repositories.budget_repo import BudgetRepository
    from app.repositories.expense_repo import ExpenseRepository
    from app.services.budget_service import BudgetService
    from datetime import datetime

    now = datetime.now()

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.is_active == True))
        users = result.scalars().all()

        for user in users:
            try:
                svc = BudgetService(BudgetRepository(session), ExpenseRepository(session))
                alerts = await svc.get_alerts(user.id, now.month, now.year)
                if alerts:
                    print(f"User {user.id} has {len(alerts)} budget alerts")
            except Exception as e:
                print(f"Budget alert check failed for user {user.id}: {e}")
