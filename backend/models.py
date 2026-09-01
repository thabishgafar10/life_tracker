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


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)
    category = Column(String, nullable=True)
    goal = Column(String, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    logs = relationship(
        "ActivityLog",
        back_populates="activity",
        cascade="all, delete-orphan"
    )


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)

    activity_id = Column(
        Integer,
        ForeignKey("activities.id"),
        nullable=False
    )

    date = Column(Date, nullable=False)

    completed = Column(
        Boolean,
        default=False,
        nullable=False
    )

    value = Column(String, nullable=True)

    notes = Column(Text, nullable=True)

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


class DailyNote(Base):
    __tablename__ = "daily_notes"

    id = Column(Integer, primary_key=True, index=True)

    date = Column(Date, nullable=False)

    content = Column(Text, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )