"""Run once to seed default system categories."""
import asyncio
from app.database import AsyncSessionLocal
from app.models.category import Category
from sqlalchemy import select


CATEGORIES = [
    {"name": "Coffee & Dining", "icon": "🍽️", "color": "#f59e0b"},
    {"name": "Groceries", "icon": "🛒", "color": "#10b981"},
    {"name": "Transportation", "icon": "🚗", "color": "#3b82f6"},
    {"name": "Entertainment", "icon": "🎬", "color": "#8b5cf6"},
    {"name": "Utilities", "icon": "💡", "color": "#6b7280"},
    {"name": "Health & Medical", "icon": "🏥", "color": "#ef4444"},
    {"name": "Shopping", "icon": "🛍️", "color": "#ec4899"},
    {"name": "Housing", "icon": "🏠", "color": "#f97316"},
    {"name": "Finance & Banking", "icon": "🏦", "color": "#0ea5e9"},
    {"name": "Travel", "icon": "✈️", "color": "#14b8a6"},
    {"name": "Education", "icon": "📚", "color": "#a855f7"},
    {"name": "Subscriptions", "icon": "🔄", "color": "#64748b"},
    {"name": "Other", "icon": "💰", "color": "#9ca3af"},
]


async def seed():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Category).where(Category.is_system == True))
        existing = result.scalars().all()
        if existing:
            print(f"Already have {len(existing)} system categories, skipping seed.")
            return

        for cat_data in CATEGORIES:
            session.add(Category(**cat_data, is_system=True))
        await session.commit()
        print(f"Seeded {len(CATEGORIES)} system categories.")


if __name__ == "__main__":
    asyncio.run(seed())
