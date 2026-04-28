import json
from uuid import uuid4, UUID
from datetime import date
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, Pagination
from app.models.user import User
from app.repositories.expense_repo import ExpenseRepository
from app.repositories.insight_repo import InsightRepository
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse, CategoryCorrectionRequest, BulkUploadResponse, JobStatusResponse
from app.services.expense_service import ExpenseService
from app.utils.redis_client import get_redis

router = APIRouter(prefix="/expenses", tags=["expenses"])


def get_service(db: AsyncSession = Depends(get_db)) -> ExpenseService:
    return ExpenseService(ExpenseRepository(db))


@router.post("", response_model=ExpenseResponse, status_code=201)
async def create_expense(
    data: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    svc: ExpenseService = Depends(get_service),
    db: AsyncSession = Depends(get_db),
):
    expense = await svc.create(current_user.id, data)
    await InsightRepository(db).invalidate_for_user(current_user.id)
    return expense


@router.get("", response_model=dict)
async def list_expenses(
    pagination: Annotated[Pagination, Depends()],
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    category_id: UUID | None = Query(None),
    current_user: User = Depends(get_current_user),
    svc: ExpenseService = Depends(get_service),
):
    expenses, total = await svc.list(
        current_user.id, pagination.offset, pagination.limit,
        date_from, date_to, category_id
    )
    return {
        "items": [ExpenseResponse.model_validate(e) for e in expenses],
        "total": total,
        "page": pagination.page,
        "limit": pagination.limit,
    }


@router.patch("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: UUID,
    data: ExpenseUpdate,
    current_user: User = Depends(get_current_user),
    svc: ExpenseService = Depends(get_service),
):
    expense = await svc.update(current_user.id, expense_id, data)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@router.delete("/{expense_id}", status_code=204)
async def delete_expense(
    expense_id: UUID,
    current_user: User = Depends(get_current_user),
    svc: ExpenseService = Depends(get_service),
    db: AsyncSession = Depends(get_db),
):
    deleted = await svc.delete(current_user.id, expense_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Expense not found")
    await InsightRepository(db).invalidate_for_user(current_user.id)


@router.post("/bulk", response_model=BulkUploadResponse)
async def upload_csv(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: User = Depends(get_current_user),
):
    job_id = str(uuid4())
    content = await file.read()

    redis = await get_redis()
    await redis.set(
        f"job:{job_id}",
        json.dumps({"status": "queued", "progress": 0, "created": 0, "failed": 0, "errors": []}),
        ex=3600,
    )

    from app.tasks.generate_insights import process_csv_import
    process_csv_import.delay(job_id, str(current_user.id), content.decode("utf-8", errors="replace"))

    return BulkUploadResponse(job_id=job_id, status="queued")


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    redis = await get_redis()
    data = await redis.get(f"job:{job_id}")
    if not data:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobStatusResponse(**json.loads(data))
