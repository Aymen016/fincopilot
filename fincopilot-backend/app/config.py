from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    environment: str = "development"
    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 10080  # 7 days
    refresh_token_expire_days: int = 7
    algorithm: str = "HS256"

    # Database
    database_url: str = "postgresql+asyncpg://fincopilot:fincopilot_secret@localhost:5432/fincopilot"

    # Redis / Celery
    redis_url: str = "redis://localhost:6379/0"

    # AWS S3
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"
    s3_bucket: str = "fincopilot-uploads"

    # AI
    anthropic_api_key: str = ""
    openai_api_key: str = ""

    # Model paths
    model_dir: str = "models"

    # Categorizer thresholds
    min_confidence_threshold: float = 0.65
    min_training_samples: int = 50


@lru_cache
def get_settings() -> Settings:
    return Settings()
