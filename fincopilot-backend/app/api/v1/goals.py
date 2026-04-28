from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.repositories.goal_repo import GoalRepository
from app.schemas.goal import GoalCreate, GoalUpdate, GoalDepositRequest, GoalResponse, GoalPlanResponse
from app.services.goal_service import GoalService

router = APIRouter(prefix="/goals", tags=["goals"])


def get_service(db: AsyncSession = Depends(get_db)) -> GoalService:
    return GoalService(GoalRepository(db))


@router.post("", response_model=GoalResponse, status_code=201)
async def create_goal(
    data: GoalCreate,
    current_user: User = Depends(get_current_user),
    svc: GoalService = Depends(get_service),
):
    return await svc.create(current_user.id, data)


@router.get("", response_model=list[GoalResponse])
async def list_goals(
    current_user: User = Depends(get_current_user),
    svc: GoalService = Depends(get_service),
):
    return await svc.list(current_user.id)


@router.patch("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: UUID,
    data: GoalUpdate,
    current_user: User = Depends(get_current_user),
    svc: GoalService = Depends(get_service),
):
    goal = await svc.repo.get(goal_id)
    if not goal or goal.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Goal not found")
    update_data = data.model_dump(exclude_none=True)
    await svc.repo.update(goal_id, update_data)
    return await svc.repo.get(goal_id)


@router.delete("/{goal_id}", status_code=204)
async def delete_goal(
    goal_id: UUID,
    current_user: User = Depends(get_current_user),
    svc: GoalService = Depends(get_service),
):
    goal = await svc.repo.get(goal_id)
    if not goal or goal.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Goal not found")
    await svc.repo.delete(goal_id)


@router.patch("/{goal_id}/deposit", response_model=GoalResponse)
async def deposit(
    goal_id: UUID,
    data: GoalDepositRequest,
    current_user: User = Depends(get_current_user),
    svc: GoalService = Depends(get_service),
):
    result = await svc.deposit(current_user.id, goal_id, data.amount, data.note)
    if not result:
        raise HTTPException(status_code=404, detail="Goal not found")
    return result


@router.get("/{goal_id}/plan")
async def get_plan(
    goal_id: UUID,
    current_user: User = Depends(get_current_user),
    svc: GoalService = Depends(get_service),
):
    plan = await svc.get_plan(current_user.id, goal_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Goal not found")
    return plan
