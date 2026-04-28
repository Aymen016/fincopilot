from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.config import get_settings
from app.database import engine, Base
from app.api.v1 import auth, expenses, categories, budgets, goals, insights, forecast, health_score, chat

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="FinCopilot API",
    version="1.0.0",
    description="AI-powered personal finance assistant",
    lifespan=lifespan,
)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://fincopilot.app"],
    allow_credentials=True,
    allow_methods=["*"],
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


@app.get("/health")
async def health():
    return {"status": "ok"}
