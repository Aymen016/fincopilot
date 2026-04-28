"""Clear all user-specific data (expenses, budgets, goals, insights) for all users."""
import asyncio
from sqlalchemy import delete
from app.database import AsyncSessionLocal
from app.models.expense import Expense
from app.models.budget import Budget
from app.models.goal import SavingsGoal
from app.models.insight import Insight


async def clear():
    async with AsyncSessionLocal() as session:
        await session.execute(delete(Insight))
        await session.execute(delete(Expense))
        await session.execute(delete(Budget))
        await session.execute(delete(SavingsGoal))
        await session.commit()
        print("All user data cleared (categories and users kept).")


if __name__ == "__main__":
    asyncio.run(clear())
