import json
import asyncio
from uuid import UUID

from app.tasks.celery_app import celery_app
from app.utils.csv_parser import parse_csv


@celery_app.task(name="app.tasks.generate_insights.process_csv_import", bind=True, max_retries=3)
def process_csv_import(self, job_id: str, user_id: str, csv_content: str):
    asyncio.run(_process_csv(job_id, user_id, csv_content))


async def _process_csv(job_id: str, user_id: str, csv_content: str):
    from app.database import AsyncSessionLocal
    from app.repositories.expense_repo import ExpenseRepository
    from app.ai.categorizer import ExpenseCategorizer
    from app.utils.redis_client import get_redis
    from datetime import date

    redis = await get_redis()
    categorizer = ExpenseCategorizer()

    expenses, parse_errors = parse_csv(csv_content)

    created = 0
    failed = len(parse_errors)
    errors = list(parse_errors)
    total = len(expenses)

    async with AsyncSessionLocal() as session:
        repo = ExpenseRepository(session)

        for i, parsed in enumerate(expenses):
            try:
                result = categorizer.predict(parsed.description, parsed.merchant or "", parsed.amount)
                await repo.create({
                    "user_id": UUID(user_id),
                    "category_id": result["category_id"],
                    "amount": parsed.amount,
                    "description": parsed.description,
                    "merchant": parsed.merchant,
                    "expense_date": date.fromisoformat(parsed.expense_date),
                    "ai_confidence": result["confidence"],
                    "is_corrected": False,
                    "metadata_": parsed.raw_row,
                })
                created += 1
            except Exception as e:
                failed += 1
                errors.append(f"Row {i + 2}: {e}")

            if (i + 1) % 10 == 0:
                progress = int((i + 1) / max(total, 1) * 100)
                await redis.set(
                    f"job:{job_id}",
                    json.dumps({"status": "processing", "progress": progress,
                                "created": created, "failed": failed, "errors": errors[:20]}),
                    ex=3600,
                )

        await session.commit()

    await redis.set(
        f"job:{job_id}",
        json.dumps({"status": "done", "progress": 100,
                    "created": created, "failed": failed, "errors": errors[:20]}),
        ex=3600,
    )


@celery_app.task(name="app.tasks.generate_insights.generate_insights_for_all_users")
def generate_insights_for_all_users():
    asyncio.run(_generate_insights())


async def _generate_insights():
    from app.database import AsyncSessionLocal
    from sqlalchemy import select
    from app.models.user import User
    from app.repositories.expense_repo import ExpenseRepository
    from app.repositories.insight_repo import InsightRepository
    from app.ai.insights_engine import InsightsEngine, UserStats

    engine = InsightsEngine()

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.is_active == True))
        users = result.scalars().all()

        for user in users:
            try:
                expense_repo = ExpenseRepository(session)
                insight_repo = InsightRepository(session)

                from datetime import datetime
                now = datetime.now()
                totals = await expense_repo.get_monthly_totals_by_category(user.id, now.month, now.year)
                grand_total = sum(t["total"] for t in totals)

                stats = UserStats(
                    dining_pct=0.0,
                    savings_rate=0.15,
                )
                if grand_total > 0 and totals:
                    max_cat = max(totals, key=lambda x: x["total"])
                    stats.dining_pct = max_cat["total"] / grand_total

                insights = engine.generate(stats)
                insight_dicts = [
                    {"user_id": user.id, "type": i["type"], "severity": i["severity"],
                     "title": i["title"], "body": i["body"]}
                    for i in insights
                ]
                if insight_dicts:
                    await insight_repo.bulk_create(insight_dicts)

            except Exception as e:
                print(f"Insight generation failed for user {user.id}: {e}")

        await session.commit()
