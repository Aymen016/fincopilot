import redis.asyncio as aioredis
from app.config import get_settings

settings = get_settings()
_redis = None


async def get_redis():
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(settings.redis_url, decode_responses=True)
    return _redis
