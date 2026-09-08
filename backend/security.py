import os
import re
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pwdlib import PasswordHash
from sqlalchemy.orm import Session

import models
from database import get_db


# =========================================================
# JWT CONFIGURATION
# =========================================================

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "dev-only-change-this-secret-key"
)

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

RESET_TOKEN_EXPIRE_MINUTES = 10


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)


# =========================================================
# PASSWORD HASHING
# =========================================================

password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    """
    Hash a plain-text password.
    """
    return password_hash.hash(password)


def verify_password(
    password: str,
    hashed_password: str
) -> bool:
    """
    Verify a plain-text password against its stored hash.
    """
    return password_hash.verify(
        password,
        hashed_password
    )


# =========================================================
# PASSWORD VALIDATION
# =========================================================

def validate_password(password: str) -> tuple[bool, str]:
    """
    Validate the application's password policy.

    Requirements:
    - 8 to 20 characters
    - at least 1 alphabetic character
    - at least 1 uppercase letter
    - at least 1 number
    - at least 1 symbol
    - no whitespace
    """

    if not 8 <= len(password) <= 20:
        return (
            False,
            "Password must be between 8 and 20 characters."
        )

    if re.search(r"\s", password):
        return (
            False,
            "Password must not contain spaces or whitespace."
        )

    if not re.search(r"[A-Za-z]", password):
        return (
            False,
            "Password must contain at least one alphabetic character."
        )

    if not re.search(r"[A-Z]", password):
        return (
            False,
            "Password must contain at least one uppercase letter."
        )

    if not re.search(r"\d", password):
        return (
            False,
            "Password must contain at least one number."
        )

    if not re.search(r"[^A-Za-z0-9]", password):
        return (
            False,
            "Password must contain at least one symbol."
        )

    return True, ""


# =========================================================
# JWT TOKEN CREATION
# =========================================================

def create_access_token(
    user_id: int
) -> str:
    """
    Create a normal access token.
    """

    expire = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    payload = {
        "sub": str(user_id),
        "type": "access",
        "exp": expire,
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def create_reset_token(
    user_id: int
) -> str:
    """
    Create a short-lived password-reset token.
    """

    expire = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=RESET_TOKEN_EXPIRE_MINUTES
        )
    )

    payload = {
        "sub": str(user_id),
        "type": "password_reset",
        "exp": expire,
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


# =========================================================
# INTERNAL JWT DECODER
# =========================================================

def _decode_token(
    token: str
):
    """
    Decode and validate a JWT.
    """

    try:
        return jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired."
        )

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token."
        )


# =========================================================
# ACCESS TOKEN DECODER
# =========================================================

def decode_access_token(
    token: str
) -> int:
    """
    Decode an access token and return the user ID.
    """

    payload = _decode_token(token)

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token."
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token."
        )

    try:
        return int(user_id)

    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token."
        )


# =========================================================
# RESET TOKEN DECODER
# =========================================================

def decode_reset_token(
    token: str
) -> int:
    """
    Decode a password-reset token and return the user ID.
    """

    payload = _decode_token(token)

    if payload.get("type") != "password_reset":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password reset token."
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password reset token."
        )

    try:
        return int(user_id)

    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password reset token."
        )


# =========================================================
# GET CURRENT USER
# =========================================================

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """
    Get the authenticated user from the access token.
    """

    user_id = decode_access_token(token)

    user = (
        db.query(models.User)
        .filter(
            models.User.id == user_id
        )
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive."
        )

    return user