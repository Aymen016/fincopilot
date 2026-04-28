import httpx
from app.config import get_settings

settings = get_settings()


async def send_verification_email(to_email: str, code: str) -> None:
    if not settings.resend_api_key:
        print(f"[DEV] Verification code for {to_email}: {code}")
        return

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            json={
                "from": settings.email_from,
                "to": [to_email],
                "subject": "Your FinCopilot verification code",
                "text": (
                    f"Hi,\n\n"
                    f"Your FinCopilot verification code is:\n\n"
                    f"  {code}\n\n"
                    f"This code expires in 15 minutes.\n\n"
                    f"If you didn't create an account, you can ignore this email."
                ),
            },
            timeout=10,
        )
        resp.raise_for_status()
