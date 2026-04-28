from pydantic import BaseModel


class ScoreDimension(BaseModel):
    value: float
    score: float
    max: int


class HealthScoreResponse(BaseModel):
    score: int
    grade: str
    breakdown: dict[str, ScoreDimension]
    trend: str
