import httpx
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.utils.security import decode_access_token
from app.ai.chat_agent import ChatAgent
from app.ai.ollama_health import check_ollama
from app.database import AsyncSessionLocal

router = APIRouter(tags=["chat"])


@router.websocket("/ws/chat")
async def chat_websocket(websocket: WebSocket, token: str = Query(...)):
    payload = decode_access_token(token)
    if not payload:
        await websocket.close(code=4001)
        return

    user_id = payload.get("sub")
    await websocket.accept()

    status = await check_ollama()
    if not status["online"]:
        await websocket.send_json({
            "type": "status",
            "online": False,
            "message": status["reason"],
        })
    else:
        await websocket.send_json({"type": "status", "online": True})

    async with AsyncSessionLocal() as session:
        agent = ChatAgent(user_id=user_id, session=session)
        try:
            async for message in websocket.iter_json():
                user_message = message.get("message", "")
                if not user_message.strip():
                    continue

                status = await check_ollama()
                if not status["online"]:
                    await websocket.send_json({
                        "type": "error",
                        "code": "ai_offline",
                        "message": status["reason"],
                    })
                    continue

                try:
                    async for chunk in agent.stream_response(user_message):
                        await websocket.send_json({"type": "delta", "content": chunk})
                    await websocket.send_json({"type": "done"})
                except (httpx.ConnectError, httpx.TimeoutException):
                    await check_ollama(force=True)  # refresh cache immediately
                    await websocket.send_json({
                        "type": "error",
                        "code": "ai_offline",
                        "message": "Lost connection to the AI model. Chat is offline.",
                    })
                except Exception:
                    await websocket.send_json({
                        "type": "error",
                        "code": "ai_error",
                        "message": "Something went wrong generating a reply.",
                    })
        except WebSocketDisconnect:
            pass
