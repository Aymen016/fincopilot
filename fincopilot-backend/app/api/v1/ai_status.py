from fastapi import APIRouter

from app.ai.ollama_health import check_ollama

router = APIRouter(tags=["ai"])


@router.get("/ai/status")
async def ai_status():
    return await check_ollama()
