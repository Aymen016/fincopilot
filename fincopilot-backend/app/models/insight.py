import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey, func, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Uuid as UUID
import enum

from app.database import Base


class InsightSeverity(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class InsightType(str, enum.Enum):
    overspend = "overspend"
    savings = "savings"
    pattern = "pattern"
    subscription = "subscription"
    goal = "goal"
    forecast = "forecast"


class Insight(Base):
    __tablename__ = "insights"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type: Mapped[InsightType] = mapped_column(Enum(InsightType), nullable=False)
    severity: Mapped[InsightSeverity] = mapped_column(Enum(InsightSeverity), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    is_dismissed: Mapped[bool] = mapped_column(Boolean, default=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="insights")
