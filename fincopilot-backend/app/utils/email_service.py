import httpx
import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.config import get_settings

settings = get_settings()

_HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#7c3aed);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">FinCopilot</h1>
              <p style="margin:6px 0 0;color:#c7d2fe;font-size:13px;">AI-powered personal finance</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 8px;color:#1e293b;font-size:16px;font-weight:600;">Verify your email address</p>
              <p style="margin:0 0 28px;color:#64748b;font-size:14px;line-height:1.6;">
                Use the code below to complete your FinCopilot registration. It expires in <strong>15 minutes</strong>.
              </p>

              <!-- Code box -->
              <div style="background:#f8fafc;border:2px dashed #6366f1;border-radius:10px;padding:24px;text-align:center;margin-bottom:28px;">
                <span style="font-size:38px;font-weight:800;letter-spacing:10px;color:#4f46e5;font-family:'Courier New',monospace;">{code}</span>
              </div>

              <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">
                If you didn't create a FinCopilot account, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                &copy; 2025 FinCopilot &nbsp;&middot;&nbsp; This is an automated message, please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

_TEXT_TEMPLATE = (
    "FinCopilot — Email Verification\n\n"
    "Your verification code is: {code}\n\n"
    "This code expires in 15 minutes.\n\n"
    "If you didn't create an account, ignore this email."
)


def _build_message(to_email: str, code: str, sender: str) -> MIMEMultipart:
    msg = MIMEMultipart("alternative")
    msg["From"] = sender
    msg["To"] = to_email
    msg["Subject"] = "Your FinCopilot verification code"
    msg.attach(MIMEText(_TEXT_TEMPLATE.format(code=code), "plain"))
    msg.attach(MIMEText(_HTML_TEMPLATE.format(code=code), "html"))
    return msg


async def send_verification_email(to_email: str, code: str) -> None:
    # --- Resend API path (preferred: works on hosts that block SMTP ports) ---
    if settings.resend_api_key:
        # Always use Resend's own sending domain — using a gmail/unverified address
        # as the sender will cause a 403. EMAIL_FROM is only for SMTP.
        sender = "FinCopilot <onboarding@resend.dev>"
        # When no domain is verified, RESEND_TEST_EMAIL overrides the recipient
        # so at least the owner can test the full registration flow.
        recipient = settings.resend_test_email or to_email
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {settings.resend_api_key}"},
                json={
                    "from": sender,
                    "to": [recipient],
                    "subject": "Your FinCopilot verification code",
                    "text": _TEXT_TEMPLATE.format(code=code),
                    "html": _HTML_TEMPLATE.format(code=code),
                },
                timeout=10,
            )
            print(f"[Resend] to={recipient} status={resp.status_code} body={resp.text}")
            resp.raise_for_status()
        return

    # --- SMTP path (Gmail or any SMTP provider) ---
    if settings.smtp_host and settings.smtp_user and settings.smtp_password:
        sender = settings.email_from or f"FinCopilot <{settings.smtp_user}>"
        msg = _build_message(to_email, code, sender)
        await aiosmtplib.send(
            msg,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user,
            password=settings.smtp_password,
            start_tls=True,
            timeout=15,
        )
        return

    # --- Dev fallback ---
    print(f"[DEV] Verification code for {to_email}: {code}")
