"""Seed realistic test data (PKR amounts) for the first user in the database."""
import asyncio
from datetime import date, timedelta
from sqlalchemy import select, delete
from app.database import AsyncSessionLocal
from app.models.user import User
from app.models.category import Category
from app.models.expense import Expense
from app.models.budget import Budget
from app.models.goal import SavingsGoal
from app.models.insight import Insight


CATEGORIES = [
    {"name": "Coffee & Dining", "icon": "\U0001f37d️", "color": "#f59e0b"},
    {"name": "Groceries", "icon": "\U0001f6d2", "color": "#10b981"},
    {"name": "Transportation", "icon": "\U0001f697", "color": "#3b82f6"},
    {"name": "Entertainment", "icon": "\U0001f3ac", "color": "#8b5cf6"},
    {"name": "Utilities", "icon": "\U0001f4a1", "color": "#6b7280"},
    {"name": "Health & Medical", "icon": "\U0001f3e5", "color": "#ef4444"},
    {"name": "Shopping", "icon": "\U0001f6cd️", "color": "#ec4899"},
    {"name": "Housing", "icon": "\U0001f3e0", "color": "#f97316"},
    {"name": "Finance & Banking", "icon": "\U0001f3e6", "color": "#0ea5e9"},
    {"name": "Travel", "icon": "✈️", "color": "#14b8a6"},
    {"name": "Education", "icon": "\U0001f4da", "color": "#a855f7"},
    {"name": "Subscriptions", "icon": "\U0001f504", "color": "#64748b"},
    {"name": "Other", "icon": "\U0001f4b0", "color": "#9ca3af"},
]

today = date.today()

EXPENSES = [
    # Coffee & Dining (PKR amounts)
    ("Starbucks coffee", "Coffee & Dining", 650, -1),
    ("McDonald's lunch", "Coffee & Dining", 980, -3),
    ("Pizza Hut dinner", "Coffee & Dining", 2400, -5),
    ("Cafe latte", "Coffee & Dining", 550, -7),
    ("KFC bucket", "Coffee & Dining", 1800, -10),
    ("Biryani restaurant", "Coffee & Dining", 1200, -14),
    ("Burger King", "Coffee & Dining", 850, -18),
    ("Tea & snacks", "Coffee & Dining", 180, -20),
    # Groceries
    ("Carrefour weekly groceries", "Groceries", 8500, -2),
    ("Vegetables & fruits", "Groceries", 1800, -9),
    ("Supermarket run", "Groceries", 6200, -16),
    ("Milk & dairy", "Groceries", 1100, -23),
    # Transportation
    ("Uber ride", "Transportation", 450, -1),
    ("Fuel refill", "Transportation", 5000, -6),
    ("Careem to airport", "Transportation", 1200, -12),
    ("Monthly metro card", "Transportation", 2500, -28),
    # Subscriptions / Entertainment
    ("Netflix subscription", "Subscriptions", 1100, -1),
    ("Spotify Premium", "Subscriptions", 699, -1),
    ("Cinema tickets x2", "Entertainment", 1800, -8),
    ("YouTube Premium", "Subscriptions", 549, -15),
    ("PS5 game", "Entertainment", 8500, -20),
    # Utilities
    ("Electricity bill", "Utilities", 6500, -5),
    ("Internet bill", "Utilities", 2500, -5),
    ("Water bill", "Utilities", 800, -5),
    # Health
    ("Pharmacy", "Health & Medical", 2200, -4),
    ("Gym membership", "Health & Medical", 4000, -28),
    # Shopping
    ("Daraz.pk order", "Shopping", 4500, -3),
    ("New shoes", "Shopping", 7800, -11),
    ("Clothing store", "Shopping", 3200, -19),
    # Housing
    ("Monthly rent", "Housing", 55000, -1),
    # Education
    ("Udemy course", "Education", 1200, -7),
    ("Books", "Education", 1800, -22),
]


async def seed():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).limit(1))
        user = result.scalar_one_or_none()
        if not user:
            print("No users found. Register first at http://localhost:3000/register")
            return
        print(f"Seeding data for: {user.email}")

        # Seed categories
        result = await session.execute(select(Category).where(Category.is_system == True))
        cats = {c.name: c for c in result.scalars().all()}
        if not cats:
            for cat_data in CATEGORIES:
                cat = Category(**cat_data, is_system=True)
                session.add(cat)
            await session.flush()
            result = await session.execute(select(Category).where(Category.is_system == True))
            cats = {c.name: c for c in result.scalars().all()}
        print(f"  Categories: {len(cats)}")

        # Clear and re-seed expenses
        await session.execute(
            __import__("sqlalchemy", fromlist=["delete"]).delete(Expense).where(Expense.user_id == user.id)
        )
        other_cat = cats.get("Other")
        count = 0
        for desc, cat_name, amount, day_offset in EXPENSES:
            cat = cats.get(cat_name, other_cat)
            if cat:
                session.add(Expense(
                    user_id=user.id,
                    category_id=cat.id,
                    amount=amount,
                    description=desc,
                    expense_date=today + timedelta(days=day_offset),
                    ai_confidence=0.95,
                ))
                count += 1
        print(f"  Added {count} expenses (PKR amounts)")

        # Clear and re-seed budgets
        await session.execute(
            __import__("sqlalchemy", fromlist=["delete"]).delete(Budget).where(Budget.user_id == user.id)
        )
        budget_data = [
            ("Coffee & Dining", 15000),
            ("Groceries", 25000),
            ("Transportation", 12000),
            ("Entertainment", 10000),
            ("Subscriptions", 5000),
            ("Shopping", 20000),
            ("Health & Medical", 8000),
        ]
        for cat_name, limit in budget_data:
            cat = cats.get(cat_name)
            if cat:
                session.add(Budget(
                    user_id=user.id,
                    category_id=cat.id,
                    amount_limit=limit,
                    month=today.month,
                    year=today.year,
                ))
        print(f"  Added {len(budget_data)} budgets")

        # Clear and re-seed goals
        await session.execute(
            __import__("sqlalchemy", fromlist=["delete"]).delete(SavingsGoal).where(SavingsGoal.user_id == user.id)
        )
        goals = [
            ("Emergency Fund", "3 months of expenses", 300000, 85000, today + timedelta(days=180)),
            ("New Laptop", "MacBook Pro for work", 350000, 80000, today + timedelta(days=90)),
            ("Vacation to Turkey", "Summer holiday fund", 500000, 120000, today + timedelta(days=120)),
        ]
        for name, desc, target, current, target_date in goals:
            session.add(SavingsGoal(
                user_id=user.id,
                name=name,
                description=desc,
                target_amount=target,
                current_amount=current,
                target_date=target_date,
            ))
        print(f"  Added {len(goals)} savings goals")

        # Clear old insights
        await session.execute(
            __import__("sqlalchemy", fromlist=["delete"]).delete(Insight).where(Insight.user_id == user.id)
        )

        # Update monthly income (PKR)
        user.monthly_income = 150000
        await session.commit()
        print("Done! Refresh the app to see your data.")
        print("Monthly income set to PKR 150,000")


if __name__ == "__main__":
    asyncio.run(seed())
