import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas

from database import get_db
from email_service import send_otp_email
from security import (
    hash_password,
    verify_password,
    validate_password,
    create_access_token,
    create_reset_token,
    decode_reset_token,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# =========================================================
# CONFIGURATION
# =========================================================

MAX_FAILED_LOGIN_ATTEMPTS = 7

LOCKOUT_MINUTES = 15

OTP_EXPIRATION_MINUTES = 10

OTP_MAX_ATTEMPTS = 5

RESET_TOKEN_EXPIRATION_MINUTES = 10


# =========================================================
# HELPER FUNCTIONS
# =========================================================

def generate_otp() -> str:
    """
    Generate a secure 6-digit OTP.
    """

    return f"{secrets.randbelow(1_000_000):06d}"


def get_user_by_email(
    email: str,
    db: Session
):
    return (
        db.query(models.User)
        .filter(models.User.email == email.lower())
        .first()
    )


def is_user_locked(user: models.User) -> bool:
    """
    Check whether the user's temporary lockout
    is still active.
    """

    if user.locked_until is None:
        return False

    now = datetime.now(timezone.utc)

    # Handle databases that return a naive datetime
    locked_until = user.locked_until

    if locked_until.tzinfo is None:
        locked_until = locked_until.replace(
            tzinfo=timezone.utc
        )

    return locked_until > now


def clear_login_failures(
    user: models.User
):
    user.failed_login_attempts = 0
    user.locked_until = None


# =========================================================
# REGISTER
# =========================================================

@router.post(
    "/register",
    response_model=schemas.UserResponse
)
def register(
    user_data: schemas.UserRegister,
    db: Session = Depends(get_db)
):
    username = user_data.username.strip()
    email = str(user_data.email).lower()

    # ---------------------------------------------
    # Validate username
    # ---------------------------------------------

    if not username:
        raise HTTPException(
            status_code=400,
            detail="Username cannot be empty."
        )

    # ---------------------------------------------
    # Validate password
    # ---------------------------------------------

    valid, message = validate_password(
        user_data.password
    )

    if not valid:
        raise HTTPException(
            status_code=400,
            detail=message
        )

    # ---------------------------------------------
    # Check duplicate username
    # ---------------------------------------------

    existing_username = (
        db.query(models.User)
        .filter(
            models.User.username == username
        )
        .first()
    )

    if existing_username is not None:
        raise HTTPException(
            status_code=409,
            detail="Username already exists."
        )

    # ---------------------------------------------
    # Check duplicate email
    # ---------------------------------------------

    existing_email = (
        db.query(models.User)
        .filter(
            models.User.email == email
        )
        .first()
    )

    if existing_email is not None:
        raise HTTPException(
            status_code=409,
            detail="Email already exists."
        )

    # ---------------------------------------------
    # Create user
    # ---------------------------------------------

    new_user = models.User(
        username=username,
        email=email,
        hashed_password=hash_password(
            user_data.password
        ),
        is_active=True,
        failed_login_attempts=0,
        locked_until=None
    )

    db.add(new_user)
    db.flush()

    # ---------------------------------------------
    # Create user-specific settings
    # ---------------------------------------------

    user_settings = models.UserSettings(
        user_id=new_user.id,
        name=username,
        email=email,
        timezone="Asia/Kolkata",
        theme="dark",
        accent_color="purple",
        daily_reminders=True,
        reminder_time="08:00",
        week_start_day="Monday"
    )

    db.add(user_settings)

    db.commit()
    db.refresh(new_user)

    return new_user


# =========================================================
# NORMAL LOGIN
# =========================================================

@router.post(
    "/login",
    response_model=schemas.TokenResponse
)
def login(
    login_data: schemas.UserLogin,
    db: Session = Depends(get_db)
):
    user = (
        db.query(models.User)
        .filter(
            models.User.username == login_data.username
        )
        .first()
    )

    # Don't reveal whether the username exists.
    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password."
        )

    # ---------------------------------------------
    # Check account status
    # ---------------------------------------------

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Account is inactive."
        )

    # ---------------------------------------------
    # Check temporary lock
    # ---------------------------------------------

    if is_user_locked(user):

        locked_until = user.locked_until

        if locked_until.tzinfo is None:
            locked_until = locked_until.replace(
                tzinfo=timezone.utc
            )

        remaining_seconds = max(
            0,
            int(
                (
                    locked_until
                    - datetime.now(timezone.utc)
                ).total_seconds()
            )
        )

        remaining_minutes = (
            remaining_seconds + 59
        ) // 60

        raise HTTPException(
            status_code=423,
            detail=(
                f"Too many failed login attempts. "
                f"Try again in approximately "
                f"{remaining_minutes} minute(s)."
            )
        )

    # ---------------------------------------------
    # Verify password
    # ---------------------------------------------

    password_correct = verify_password(
        login_data.password,
        user.hashed_password
    )

    if not password_correct:

        user.failed_login_attempts += 1

        # Lock account after 7 failures
        if (
            user.failed_login_attempts
            >= MAX_FAILED_LOGIN_ATTEMPTS
        ):
            user.locked_until = (
                datetime.now(timezone.utc)
                + timedelta(
                    minutes=LOCKOUT_MINUTES
                )
            )

            db.commit()

            raise HTTPException(
                status_code=423,
                detail=(
                    "Too many failed login attempts. "
                    "Your account has been temporarily "
                    "locked for 15 minutes."
                )
            )

        db.commit()

        remaining_attempts = (
            MAX_FAILED_LOGIN_ATTEMPTS
            - user.failed_login_attempts
        )

        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid username or password. "
                f"{remaining_attempts} attempt(s) remaining."
            )
        )

    # ---------------------------------------------
    # Correct password
    # ---------------------------------------------

    clear_login_failures(user)

    db.commit()

    # ---------------------------------------------
    # Create JWT
    # ---------------------------------------------

    access_token = create_access_token(
        user.id
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# =========================================================
# REQUEST OTP
# =========================================================

@router.post("/request-otp")
async def request_otp(
    otp_data: schemas.OTPRequest,
    db: Session = Depends(get_db)
):
    email = str(otp_data.email).lower()

    user = get_user_by_email(
        email,
        db
    )

    # For a real production application we would
    # normally avoid revealing account existence.
    # For this project, returning the exact result
    # keeps the frontend experience straightforward.

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="No account found with this email."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Account is inactive."
        )

    # ---------------------------------------------
    # Generate OTP
    # ---------------------------------------------

    otp = generate_otp()

    otp_hash = hash_password(otp)

    expires_at = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=OTP_EXPIRATION_MINUTES
        )
    )

    # ---------------------------------------------
    # Invalidate previous unused OTPs
    # ---------------------------------------------

    previous_otps = (
        db.query(models.PasswordOTP)
        .filter(
            models.PasswordOTP.user_id == user.id,
            models.PasswordOTP.used == False
        )
        .all()
    )

    for previous_otp in previous_otps:
        previous_otp.used = True

    # ---------------------------------------------
    # Store new OTP
    # ---------------------------------------------

    new_otp = models.PasswordOTP(
        user_id=user.id,
        otp_hash=otp_hash,
        expires_at=expires_at,
        attempts=0,
        used=False
    )

    db.add(new_otp)

    db.commit()

    # ---------------------------------------------
    # Send email
    # ---------------------------------------------

    try:

        await send_otp_email(
            recipient=email,
            otp=otp
        )

    except Exception:

        # Remove the OTP if the email failed.
        db.delete(new_otp)
        db.commit()

        raise HTTPException(
            status_code=500,
            detail="Failed to send OTP email."
        )

    return {
        "message": "OTP sent successfully.",
        "purpose": otp_data.purpose
    }


# =========================================================
# VERIFY OTP
# =========================================================

@router.post("/verify-otp")
def verify_otp(
    otp_data: schemas.OTPVerify,
    db: Session = Depends(get_db)
):
    email = str(otp_data.email).lower()

    user = get_user_by_email(
        email,
        db
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="No account found with this email."
        )

    otp_record = (
        db.query(models.PasswordOTP)
        .filter(
            models.PasswordOTP.user_id == user.id,
            models.PasswordOTP.used == False
        )
        .order_by(
            models.PasswordOTP.created_at.desc()
        )
        .first()
    )

    if otp_record is None:
        raise HTTPException(
            status_code=400,
            detail="No active OTP found."
        )

    # ---------------------------------------------
    # Check expiration
    # ---------------------------------------------

    expires_at = otp_record.expires_at

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(
            tzinfo=timezone.utc
        )

    if expires_at < datetime.now(timezone.utc):

        otp_record.used = True
        db.commit()

        raise HTTPException(
            status_code=400,
            detail="OTP has expired."
        )

    # ---------------------------------------------
    # Limit OTP attempts
    # ---------------------------------------------

    if otp_record.attempts >= OTP_MAX_ATTEMPTS:

        otp_record.used = True
        db.commit()

        raise HTTPException(
            status_code=400,
            detail="Too many incorrect OTP attempts."
        )

    # ---------------------------------------------
    # Verify OTP
    # ---------------------------------------------

    if not verify_password(
        otp_data.otp,
        otp_record.otp_hash
    ):

        otp_record.attempts += 1
        db.commit()

        remaining_attempts = (
            OTP_MAX_ATTEMPTS
            - otp_record.attempts
        )

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid OTP. "
                f"{remaining_attempts} attempt(s) remaining."
            )
        )

    # ---------------------------------------------
    # OTP is correct
    # ---------------------------------------------

    otp_record.used = True
    db.commit()

    # ---------------------------------------------
    # OTP LOGIN
    # ---------------------------------------------

    if otp_data.purpose == "login":

        access_token = create_access_token(
            user.id
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "purpose": "login"
        }

    # ---------------------------------------------
    # PASSWORD RESET
    # ---------------------------------------------

    reset_token = create_reset_token(
        user.id
    )

    return {
        "reset_token": reset_token,
        "purpose": "password_reset"
    }


# =========================================================
# RESET PASSWORD
# =========================================================

@router.post("/reset-password")
def reset_password(
    reset_data: schemas.PasswordResetRequest,
    db: Session = Depends(get_db)
):

    # ---------------------------------------------
    # Decode reset token
    # ---------------------------------------------

    try:
        user_id = decode_reset_token(
            reset_data.reset_token
        )

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired reset token."
        )

    # ---------------------------------------------
    # Find user
    # ---------------------------------------------

    user = (
        db.query(models.User)
        .filter(
            models.User.id == user_id
        )
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    # ---------------------------------------------
    # Validate new password
    # ---------------------------------------------

    valid, message = validate_password(
        reset_data.new_password
    )

    if not valid:
        raise HTTPException(
            status_code=400,
            detail=message
        )

    # ---------------------------------------------
    # Change password
    # ---------------------------------------------

    user.hashed_password = hash_password(
        reset_data.new_password
    )

    # Reset failed login counter
    clear_login_failures(user)

    db.commit()

    return {
        "message": "Password reset successfully."
    }


# =========================================================
# CURRENT USER
# =========================================================

@router.get(
    "/me",
    response_model=schemas.UserResponse
)
def get_current_user(
    user_id: int,
    db: Session = Depends(get_db)
):

    user = (
        db.query(models.User)
        .filter(
            models.User.id == user_id
        )
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    return user