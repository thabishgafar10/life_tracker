from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional


# =========================
# ACTIVITY SCHEMAS
# =========================

class ActivityCreate(BaseModel):
    name: str
    category: Optional[str] = None
    goal: Optional[str] = None


class ActivityResponse(BaseModel):
    id: int
    name: str
    category: Optional[str] = None
    goal: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# =========================
# ACTIVITY LOG SCHEMAS
# =========================

class ActivityLogCreate(BaseModel):
    activity_id: int
    date: date
    completed: bool = False
    value: Optional[str] = None
    notes: Optional[str] = None


class ActivityLogResponse(BaseModel):
    id: int
    activity_id: int
    date: date
    completed: bool
    value: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True

# =========================
# DAILY NOTE SCHEMAS
# =========================

class DailyNoteCreate(BaseModel):
    date: date
    content: str


class DailyNoteResponse(BaseModel):
    id: int
    date: date
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

# =========================
# ANALYTICS SCHEMAS
# =========================

class ActivityStatisticsResponse(BaseModel):
    activity_id: int
    activity_name: str
    total_logs: int
    completed_logs: int
    missed_logs: int
    completion_rate: float
    current_streak: int
    best_streak: int

# =========================
# OVERVIEW ANALYTICS
# =========================

class OverviewStatisticsResponse(BaseModel):
    total_activities: int
    total_logs: int
    completed_logs: int
    missed_logs: int
    overall_completion_rate: float

# =========================
# TREND SCHEMAS
# =========================

class DailyTrendResponse(BaseModel):
    date: date
    total: int
    completed: int
    completion_rate: float

class WeeklyTrendResponse(BaseModel):
    week: str
    total: int
    completed: int
    completion_rate: float

# =========================
# CALENDAR SCHEMAS
# =========================

class CalendarDayResponse(BaseModel):
    date: date
    total: int
    completed: int
    completion_rate: float

# =========================
# SETTINGS SCHEMAS
# =========================

class SettingsResponse(BaseModel):
    id: int
    name: str
    email: str
    timezone: str
    theme: str
    accent_color: str
    daily_reminders: bool
    reminder_time: str
    week_start_day: str

    class Config:
        from_attributes = True


class SettingsUpdate(BaseModel):
    name: str
    email: str
    timezone: str
    theme: str
    accent_color: str
    daily_reminders: bool
    reminder_time: str
    week_start_day: str