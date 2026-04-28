from pydantic import BaseModel


class CategoryForecast(BaseModel):
    category_id: str
    category_name: str
    predicted_amount: float
    budget_amount: float | None = None


class MonthlyForecastResponse(BaseModel):
    month: int
    year: int
    total_predicted: float
    by_category: list[CategoryForecast]


class RiskFlag(BaseModel):
    category_id: str
    category_name: str
    predicted: float
    budget: float
    risk_level: str
    overspend_by: float


class ForecastRiskResponse(BaseModel):
    risk_flags: list[RiskFlag]
