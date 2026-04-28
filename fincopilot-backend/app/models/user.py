import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Uuid as UUID

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    monthly_income: Mapped[float | None] = mapped_column(nullable=True)
    verification_code: Mapped[str | None] = mapped_column(String(6), nullable=True)
    code_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    expenses: Mapped[list["Expense"]] = relationship("Expense", back_populates="user", lazy="select")
    budgets: Mapped[list["Budget"]] = relationship("Budget", back_populates="user", lazy="select")
    goals: Mapped[list["SavingsGoal"]] = relationship("SavingsGoal", back_populates="user", lazy="select")
    insights: Mapped[list["Insight"]] = relationship("Insight", back_populates="user", lazy="select")
