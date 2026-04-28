import asyncio
from app.tasks.celery_app import celery_app


@celery_app.task(name="app.tasks.retrain_categorizer.retrain_for_all_users")
def retrain_for_all_users():
    asyncio.run(_retrain())


async def _retrain():
    from app.database import AsyncSessionLocal
    from app.repositories.expense_repo import ExpenseRepository
    from app.ai.categorizer import ExpenseCategorizer
    from app.config import get_settings

    settings = get_settings()
    categorizer = ExpenseCategorizer(settings.model_dir)

    async with AsyncSessionLocal() as session:
        repo = ExpenseRepository(session)
        corrections = await repo.get_corrections_for_training()
        if len(corrections) >= settings.min_training_samples:
            categorizer.retrain(corrections)
