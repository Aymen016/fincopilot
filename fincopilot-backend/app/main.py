import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from sqlalchemy import text

from app.config import get_settings
from app.database import engine, Base
from app.api.v1 import auth, expenses, categories, budgets, goals, insights, forecast, health_score, chat, ai_status

settings = get_settings()
logger = logging.getLogger("fincopilot.startup")


async def _init_database() -> None:
    """Create tables, apply lightweight migrations and seed categories.

    Runs in the background so the HTTP server can start serving (and pass the
    platform health check) immediately, even if the database is slow to wake.
    Retries a few times so a briefly-unreachable DB doesn't require a redeploy.
    """
    for attempt in range(1, 6):
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
                if settings.database_url.startswith("sqlite"):
                    for stmt in [
                        "ALTER TABLE users ADD COLUMN verification_code VARCHAR(6)",
                        "ALTER TABLE users ADD COLUMN code_expires_at DATETIME",
                    ]:
                        try:
                            await conn.execute(text(stmt))
                        except Exception:
                            pass  # column already exists
                else:
                    await conn.execute(text(
                        "ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code VARCHAR(6);"
                    ))
                    await conn.execute(text(
                        "ALTER TABLE users ADD COLUMN IF NOT EXISTS code_expires_at TIMESTAMPTZ;"
                    ))
            from app.utils.seed_categories import seed as seed_categories
            await seed_categories()
            logger.info("Database initialised successfully.")
            return
        except Exception as e:
            logger.warning("DB init attempt %s/5 failed: %s", attempt, e)
            await asyncio.sleep(min(5 * attempt, 20))
    logger.error("Database initialisation failed after retries; will init lazily on demand.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Kick off DB setup in the background so startup doesn't block the server.
    task = asyncio.create_task(_init_database())
    yield
    task.cancel()



app = FastAPI(
    title="FinCopilot API",
    version="1.0.0",
    description="AI-powered personal finance assistant",
    lifespan=lifespan,
)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.allowed_origins.split(",")],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

PREFIX = "/api/v1"
app.include_router(auth.router, prefix=PREFIX)
app.include_router(expenses.router, prefix=PREFIX)
app.include_router(categories.router, prefix=PREFIX)
app.include_router(budgets.router, prefix=PREFIX)
app.include_router(goals.router, prefix=PREFIX)
app.include_router(insights.router, prefix=PREFIX)
app.include_router(forecast.router, prefix=PREFIX)
app.include_router(health_score.router, prefix=PREFIX)
app.include_router(chat.router, prefix=PREFIX)
app.include_router(ai_status.router, prefix=PREFIX)


@app.get("/health")
async def health():
    return {"status": "ok"}
