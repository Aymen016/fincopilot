import httpx
import aiosmtplib
from email.message import EmailMessage
from app.config import get_settings

settings = get_settings()

_BODY = (
    "Hi,\n\n"
    "Your FinCopilot verification code is:\n\n"
    "  {code}\n\n"
    "This code expires in 15 minutes.\n\n"
    "If you didn't create an account, you can ignore this email."
)


async def send_verification_email(to_email: str, code: str) -> None:
    # --- SMTP path (Gmail or any SMTP provider) ---
    if settings.smtp_host and settings.smtp_user and settings.smtp_password:
        sender = settings.email_from or settings.smtp_user
        msg = EmailMessage()
        msg["From"] = sender
        msg["To"] = to_email
        msg["Subject"] = "Your FinCopilot verification code"
        msg.set_content(_BODY.format(code=code))
        await aiosmtplib.send(
            msg,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user,
            password=settings.smtp_password,
            start_tls=True,
        )
        return

    # --- Resend API path ---
    if settings.resend_api_key:
        sender = settings.email_from or "FinCopilot <onboarding@resend.dev>"
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {settings.resend_api_key}"},
                json={
                    "from": sender,
                    "to": [to_email],
                    "subject": "Your FinCopilot verification code",
                    "text": _BODY.format(code=code),
                },
                timeout=10,
            )
            print(f"[Resend] status={resp.status_code} body={resp.text}")
            resp.raise_for_status()
        return

    # --- Dev fallback ---
    print(f"[DEV] Verification code for {to_email}: {code}")
