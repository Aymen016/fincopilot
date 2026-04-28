from celery import Celery
from celery.schedules import crontab
from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "fincopilot",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=[
        "app.tasks.generate_insights",
        "app.tasks.retrain_categorizer",
        "app.tasks.alert_budgets",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "generate-insights-nightly": {
            "task": "app.tasks.generate_insights.generate_insights_for_all_users",
            "schedule": crontab(hour=2, minute=0),
        },
        "retrain-categorizer-weekly": {
            "task": "app.tasks.retrain_categorizer.retrain_for_all_users",
            "schedule": crontab(day_of_week=0, hour=3, minute=0),
        },
        "check-budget-alerts-daily": {
            "task": "app.tasks.alert_budgets.check_all_budget_alerts",
            "schedule": crontab(hour=8, minute=0),
        },
    },
)
