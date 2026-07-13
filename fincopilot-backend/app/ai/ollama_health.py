import os
import time
import httpx

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")

_cache = {"ok": False, "reason": "not checked", "at": 0.0}
_TTL = 30  # seconds


async def check_ollama(force: bool = False) -> dict:
    now = time.time()
    if not force and now - _cache["at"] < _TTL:
        return {"online": _cache["ok"], "reason": _cache["reason"], "model": OLLAMA_MODEL}

    online, reason = False, ""
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            r = await client.get(f"{OLLAMA_URL}/api/tags")
            r.raise_for_status()
            models = [m.get("name", "") for m in r.json().get("models", [])]
            if any(m.split(":")[0] == OLLAMA_MODEL.split(":")[0] for m in models):
                online, reason = True, "ok"
            else:
                reason = f"Ollama is running but model '{OLLAMA_MODEL}' is not pulled."
    except httpx.ConnectError:
        reason = "Ollama is not reachable. AI chat is offline."
    except httpx.TimeoutException:
        reason = "Ollama did not respond in time."
    except Exception as e:
        reason = f"Ollama check failed: {type(e).__name__}"

    _cache.update({"ok": online, "reason": reason, "at": now})
    return {"online": online, "reason": reason, "model": OLLAMA_MODEL}