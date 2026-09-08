from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Date,
    Boolean,
    ForeignKey,
    Text,
    UniqueConstraint
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from database import Base


# =========================================================
# ACTIVITY
# =========================================================

class Activity(Base):
    __tablename__ = "activities"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String,
        nullable=False
    )

    category = Column(
        String,
        nullable=True
    )

    goal = Column(
        String,
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    logs = relationship(
        "ActivityLog",
        back_populates="activity",
        cascade="all, delete-orphan"
    )


# =========================================================
# ACTIVITY LOG
# =========================================================

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    activity_id = Column(
        Integer,
        ForeignKey("activities.id"),
        nullable=False
    )

    date = Column(
        Date,
        nullable=False
    )

    completed = Column(
        Boolean,
        default=False,
        nullable=False
    )

    value = Column(
        String,
        nullable=True
    )

    notes = Column(
        Text,
        nullable=True
    )

    activity = relationship(
        "Activity",
        back_populates="logs"
    )

    __table_args__ = (
        UniqueConstraint(
            "activity_id",
            "date",
            name="unique_activity_per_day"
        ),
    )


# =========================================================
# DAILY NOTE
# =========================================================

class DailyNote(Base):
    __tablename__ = "daily_notes"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    date = Column(
        Date,
        nullable=False
    )

    content = Column(
        Text,
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


# =========================================================
# OLD SETTINGS TABLE
# =========================================================
# Kept for now so we don't break the existing database.
# Later, authenticated users will use UserSettings instead.

class Settings(Base):
    __tablename__ = "settings"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String,
        nullable=False,
        default="Demo User"
    )

    email = Column(
        String,
        nullable=False,
        default="demo@habitflow.com"
    )

    timezone = Column(
        String,
        nullable=False,
        default="Asia/Kolkata"
    )

    theme = Column(
        String,
        nullable=False,
        default="dark"
    )

    accent_color = Column(
        String,
        nullable=False,
        default="purple"
    )

    daily_reminders = Column(
        Boolean,
        nullable=False,
        default=True
    )

    reminder_time = Column(
        String,
        nullable=False,
        default="08:00"
    )

    week_start_day = Column(
        String,
        nullable=False,
        default="Monday"
    )


# =========================================================
# USER
# =========================================================

class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    username = Column(
        String,
        unique=True,
        index=True,
        nullable=False
    )

    email = Column(
        String,
        unique=True,
        index=True,
        nullable=False
    )

    hashed_password = Column(
        String,
        nullable=False
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False
    )

    # Number of consecutive incorrect password attempts
    failed_login_attempts = Column(
        Integer,
        nullable=False,
        default=0
    )

    # Temporary lockout time
    locked_until = Column(
        DateTime(timezone=True),
        nullable=True
    )

    settings = relationship(
        "UserSettings",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )


# =========================================================
# USER SETTINGS
# =========================================================

class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    name = Column(
        String,
        nullable=False
    )

    email = Column(
        String,
        nullable=False
    )

    timezone = Column(
        String,
        nullable=False,
        default="Asia/Kolkata"
    )

    theme = Column(
        String,
        nullable=False,
        default="dark"
    )

    accent_color = Column(
        String,
        nullable=False,
        default="purple"
    )

    daily_reminders = Column(
        Boolean,
        nullable=False,
        default=True
    )

    reminder_time = Column(
        String,
        nullable=False,
        default="08:00"
    )

    week_start_day = Column(
        String,
        nullable=False,
        default="Monday"
    )

    user = relationship(
        "User",
        back_populates="settings"
    )


# =========================================================
# PASSWORD OTP
# =========================================================

class PasswordOTP(Base):
    __tablename__ = "password_otps"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    otp_hash = Column(
        String,
        nullable=False
    )

    expires_at = Column(
        DateTime(timezone=True),
        nullable=False
    )

    attempts = Column(
        Integer,
        nullable=False,
        default=0
    )

    used = Column(
        Boolean,
        nullable=False,
        default=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    user = relationship(
        "User"
    )