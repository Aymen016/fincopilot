import random
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.user import UserCreate, UserResponse, TokenResponse, TokenRefresh, VerifyEmailRequest, ResendCodeRequest, LoginRequest
from app.utils.security import create_access_token, create_refresh_token, decode_access_token
from app.utils.email_service import send_verification_email

router = APIRouter(prefix="/auth", tags=["auth"])


def _generate_code() -> str:
    return str(random.randint(100000, 999999))


@router.post("/register", status_code=202)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    repo = UserRepository(db)
    existing = await repo.get_by_email(data.email)

    code = _generate_code()
    expires = datetime.now(timezone.utc) + timedelta(minutes=15)

    if existing:
        if existing.is_verified:
            raise HTTPException(status_code=400, detail="Email already registered")
        # Resend code to unverified account
        await repo.update(existing.id, {
            "verification_code": code,
            "code_expires_at": expires,
        })
    else:
        await repo.create({
            "email": data.email,
            "hashed_password": "",
            "full_name": data.full_name,
            "is_verified": False,
            "verification_code": code,
            "code_expires_at": expires,
        })

    try:
        await send_verification_email(data.email, code)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Failed to send verification email: {e}")
    return {"message": "Verification code sent to your email"}


@router.post("/resend-code", status_code=202)
async def resend_code(data: ResendCodeRequest, db: AsyncSession = Depends(get_db)):
    repo = UserRepository(db)
    user = await repo.get_by_email(data.email)
    # Always return 202 so we don't reveal whether an email is registered
    if not user:
        return {"message": "If that account exists, a new code has been sent"}

    code = _generate_code()
    expires = datetime.now(timezone.utc) + timedelta(minutes=15)
    await repo.update(user.id, {
        "verification_code": code,
        "code_expires_at": expires,
    })

    try:
        await send_verification_email(user.email, code)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Failed to send verification email: {e}")
    return {"message": "A new verification code has been sent"}


@router.post("/verify-email", response_model=TokenResponse)
async def verify_email(data: VerifyEmailRequest, db: AsyncSession = Depends(get_db)):
    repo = UserRepository(db)
    user = await repo.get_by_email(data.email)

    if not user or not user.verification_code:
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    if user.code_expires_at and datetime.now(timezone.utc) > user.code_expires_at.replace(tzinfo=timezone.utc):
        raise HTTPException(status_code=400, detail="Code expired — please register again")

    if user.verification_code != data.code:
        raise HTTPException(status_code=400, detail="Incorrect code")

    await repo.update(user.id, {
        "is_verified": True,
        "verification_code": None,
        "code_expires_at": None,
    })

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/token", status_code=202)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    repo = UserRepository(db)
    user = await repo.get_by_email(data.email)
    if not user:
        raise HTTPException(status_code=404, detail="No account found with that email. Please sign up first.")

    # Passwordless login: send a fresh verification code every time
    code = _generate_code()
    expires = datetime.now(timezone.utc) + timedelta(minutes=15)
    await repo.update(user.id, {
        "verification_code": code,
        "code_expires_at": expires,
    })

    try:
        await send_verification_email(user.email, code)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Failed to send verification email: {e}")
    return {"message": "Verification code sent to your email"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: TokenRefresh, db: AsyncSession = Depends(get_db)):
    payload = decode_access_token(data.refresh_token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    user_id = payload.get("sub")
    repo = UserRepository(db)
    user = await repo.get(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )
