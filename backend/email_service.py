import os

from email.message import EmailMessage

import aiosmtplib


SMTP_HOST = os.getenv(
    "SMTP_HOST",
    "smtp.gmail.com"
)

SMTP_PORT = int(
    os.getenv("SMTP_PORT", "587")
)

SMTP_USERNAME = os.getenv(
    "SMTP_USERNAME"
)

SMTP_PASSWORD = os.getenv(
    "SMTP_PASSWORD"
)


async def send_otp_email(
    recipient: str,
    otp: str
):

    if not SMTP_USERNAME or not SMTP_PASSWORD:
        raise RuntimeError(
            "SMTP credentials are not configured."
        )

    message = EmailMessage()

    message["From"] = SMTP_USERNAME
    message["To"] = recipient
    message["Subject"] = (
        "Life Tracker verification code"
    )

    message.set_content(
        f"""
Your Life Tracker verification code is:

{otp}

This code expires in 10 minutes.

If you did not request this code, you can safely ignore this email.
"""
    )

    await aiosmtplib.send(
        message,
        hostname=SMTP_HOST,
        port=SMTP_PORT,
        start_tls=True,
        username=SMTP_USERNAME,
        password=SMTP_PASSWORD,
    )