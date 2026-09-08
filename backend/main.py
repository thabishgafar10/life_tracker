from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, get_db
import models
import schemas
import analytics
import auth


# =========================================================
# CREATE DATABASE TABLES
# =========================================================

Base.metadata.create_all(bind=engine)


# =========================================================
# APP
# =========================================================

app = FastAPI(
    title="Life Tracker API"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# AUTHENTICATION ROUTES
# =========================================================

app.include_router(
    auth.router
)


# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():
    return {
        "message": "Life Tracker API is running!"
    }


# =========================================================
# ACTIVITIES
# =========================================================

# CREATE AN ACTIVITY
@app.post(
    "/activities",
    response_model=schemas.ActivityResponse
)
def create_activity(
    activity: schemas.ActivityCreate,
    db: Session = Depends(get_db)
):
    new_activity = models.Activity(
        name=activity.name,
        category=activity.category,
        goal=activity.goal
    )

    db.add(new_activity)
    db.commit()
    db.refresh(new_activity)

    return new_activity


# UPDATE AN ACTIVITY
@app.put(
    "/activities/{activity_id}",
    response_model=schemas.ActivityResponse
)
def update_activity(
    activity_id: int,
    activity: schemas.ActivityCreate,
    db: Session = Depends(get_db)
):
    existing_activity = (
        db.query(models.Activity)
        .filter(
            models.Activity.id == activity_id
        )
        .first()
    )

    if existing_activity is None:
        raise HTTPException(
            status_code=404,
            detail="Activity not found"
        )

    existing_activity.name = activity.name
    existing_activity.category = activity.category
    existing_activity.goal = activity.goal

    db.commit()
    db.refresh(existing_activity)

    return existing_activity


# GET ALL ACTIVITIES
@app.get(
    "/activities",
    response_model=list[schemas.ActivityResponse]
)
def get_activities(
    db: Session = Depends(get_db)
):
    activities = (
        db.query(models.Activity)
        .all()
    )

    return activities


# DELETE AN ACTIVITY
@app.delete(
    "/activities/{activity_id}"
)
def delete_activity(
    activity_id: int,
    db: Session = Depends(get_db)
):
    activity = (
        db.query(models.Activity)
        .filter(
            models.Activity.id == activity_id
        )
        .first()
    )

    if activity is None:
        raise HTTPException(
            status_code=404,
            detail="Activity not found"
        )

    db.delete(activity)
    db.commit()

    return {
        "message": "Activity deleted successfully"
    }


# =========================================================
# ACTIVITY LOGS
# =========================================================

# CREATE ACTIVITY LOG
@app.post(
    "/activity-logs",
    response_model=schemas.ActivityLogResponse
)
def create_activity_log(
    log: schemas.ActivityLogCreate,
    db: Session = Depends(get_db)
):
    # Check whether the activity exists
    activity = (
        db.query(models.Activity)
        .filter(
            models.Activity.id == log.activity_id
        )
        .first()
    )

    if activity is None:
        raise HTTPException(
            status_code=404,
            detail="Activity not found"
        )

    # Check for duplicate activity log
    existing_log = (
        db.query(models.ActivityLog)
        .filter(
            models.ActivityLog.activity_id == log.activity_id,
            models.ActivityLog.date == log.date
        )
        .first()
    )

    if existing_log is not None:
        raise HTTPException(
            status_code=409,
            detail=(
                "A log for this activity already "
                "exists for this date"
            )
        )

    # Create new log
    new_log = models.ActivityLog(
        activity_id=log.activity_id,
        date=log.date,
        completed=log.completed,
        value=log.value,
        notes=log.notes
    )

    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    return new_log


# GET ALL ACTIVITY LOGS
@app.get(
    "/activity-logs",
    response_model=list[schemas.ActivityLogResponse]
)
def get_activity_logs(
    db: Session = Depends(get_db)
):
    logs = (
        db.query(models.ActivityLog)
        .order_by(
            models.ActivityLog.date.desc()
        )
        .all()
    )

    return logs


# UPDATE ACTIVITY LOG
@app.put(
    "/activity-logs/{log_id}",
    response_model=schemas.ActivityLogResponse
)
def update_activity_log(
    log_id: int,
    log: schemas.ActivityLogCreate,
    db: Session = Depends(get_db)
):
    # Find existing log
    existing_log = (
        db.query(models.ActivityLog)
        .filter(
            models.ActivityLog.id == log_id
        )
        .first()
    )

    if existing_log is None:
        raise HTTPException(
            status_code=404,
            detail="Activity log not found"
        )

    # Make sure the new activity exists
    activity = (
        db.query(models.Activity)
        .filter(
            models.Activity.id == log.activity_id
        )
        .first()
    )

    if activity is None:
        raise HTTPException(
            status_code=404,
            detail="Activity not found"
        )

    # Check whether changing activity/date
    # would create a duplicate log
    duplicate_log = (
        db.query(models.ActivityLog)
        .filter(
            models.ActivityLog.activity_id == log.activity_id,
            models.ActivityLog.date == log.date,
            models.ActivityLog.id != log_id
        )
        .first()
    )

    if duplicate_log is not None:
        raise HTTPException(
            status_code=409,
            detail=(
                "Another log already exists for "
                "this activity on this date"
            )
        )

    # Update existing log
    existing_log.activity_id = log.activity_id
    existing_log.date = log.date
    existing_log.completed = log.completed
    existing_log.value = log.value
    existing_log.notes = log.notes

    db.commit()
    db.refresh(existing_log)

    return existing_log


# DELETE ACTIVITY LOG
@app.delete(
    "/activity-logs/{log_id}"
)
def delete_activity_log(
    log_id: int,
    db: Session = Depends(get_db)
):
    existing_log = (
        db.query(models.ActivityLog)
        .filter(
            models.ActivityLog.id == log_id
        )
        .first()
    )

    if existing_log is None:
        raise HTTPException(
            status_code=404,
            detail="Activity log not found"
        )

    db.delete(existing_log)
    db.commit()

    return {
        "message": "Activity log deleted successfully"
    }


# =========================================================
# DAILY NOTES
# =========================================================

# CREATE DAILY NOTE
@app.post(
    "/daily-notes",
    response_model=schemas.DailyNoteResponse
)
def create_daily_note(
    note: schemas.DailyNoteCreate,
    db: Session = Depends(get_db)
):
    new_note = models.DailyNote(
        date=note.date,
        content=note.content
    )

    db.add(new_note)
    db.commit()
    db.refresh(new_note)

    return new_note


# GET ALL DAILY NOTES
@app.get(
    "/daily-notes",
    response_model=list[schemas.DailyNoteResponse]
)
def get_daily_notes(
    db: Session = Depends(get_db)
):
    notes = (
        db.query(models.DailyNote)
        .order_by(
            models.DailyNote.date.desc()
        )
        .all()
    )

    return notes


# UPDATE DAILY NOTE
@app.put(
    "/daily-notes/{note_id}",
    response_model=schemas.DailyNoteResponse
)
def update_daily_note(
    note_id: int,
    note: schemas.DailyNoteCreate,
    db: Session = Depends(get_db)
):
    existing_note = (
        db.query(models.DailyNote)
        .filter(
            models.DailyNote.id == note_id
        )
        .first()
    )

    if existing_note is None:
        raise HTTPException(
            status_code=404,
            detail="Daily note not found"
        )

    existing_note.date = note.date
    existing_note.content = note.content

    db.commit()
    db.refresh(existing_note)

    return existing_note


# DELETE DAILY NOTE
@app.delete(
    "/daily-notes/{note_id}"
)
def delete_daily_note(
    note_id: int,
    db: Session = Depends(get_db)
):
    existing_note = (
        db.query(models.DailyNote)
        .filter(
            models.DailyNote.id == note_id
        )
        .first()
    )

    if existing_note is None:
        raise HTTPException(
            status_code=404,
            detail="Daily note not found"
        )

    db.delete(existing_note)
    db.commit()

    return {
        "message": "Daily note deleted successfully"
    }


# =========================================================
# ANALYTICS
# =========================================================

# GET ACTIVITY STATISTICS
@app.get(
    "/analytics/activity/{activity_id}",
    response_model=schemas.ActivityStatisticsResponse
)
def get_activity_statistics(
    activity_id: int,
    db: Session = Depends(get_db)
):
    activity = (
        db.query(models.Activity)
        .filter(
            models.Activity.id == activity_id
        )
        .first()
    )

    if activity is None:
        raise HTTPException(
            status_code=404,
            detail="Activity not found"
        )

    logs = (
        db.query(models.ActivityLog)
        .filter(
            models.ActivityLog.activity_id == activity_id
        )
        .all()
    )

    statistics = (
        analytics.calculate_activity_statistics(logs)
    )

    streaks = (
        analytics.calculate_streaks(logs)
    )

    return {
        "activity_id": activity.id,
        "activity_name": activity.name,
        **statistics,
        **streaks
    }


# GET WEEKLY ACTIVITY STATISTICS
@app.get(
    "/analytics/activity/{activity_id}/weekly",
    response_model=schemas.ActivityStatisticsResponse
)
def get_weekly_activity_statistics(
    activity_id: int,
    db: Session = Depends(get_db)
):
    activity = (
        db.query(models.Activity)
        .filter(
            models.Activity.id == activity_id
        )
        .first()
    )

    if activity is None:
        raise HTTPException(
            status_code=404,
            detail="Activity not found"
        )

    logs = (
        db.query(models.ActivityLog)
        .filter(
            models.ActivityLog.activity_id == activity_id
        )
        .all()
    )

    start_date, end_date = (
        analytics.get_week_range()
    )

    weekly_logs = (
        analytics.filter_logs_by_date(
            logs,
            start_date,
            end_date
        )
    )

    statistics = (
        analytics.calculate_activity_statistics(
            weekly_logs
        )
    )

    streaks = (
        analytics.calculate_streaks(
            weekly_logs
        )
    )

    return {
        "activity_id": activity.id,
        "activity_name": activity.name,
        **statistics,
        **streaks
    }


# GET MONTHLY ACTIVITY STATISTICS
@app.get(
    "/analytics/activity/{activity_id}/monthly",
    response_model=schemas.ActivityStatisticsResponse
)
def get_monthly_activity_statistics(
    activity_id: int,
    db: Session = Depends(get_db)
):
    activity = (
        db.query(models.Activity)
        .filter(
            models.Activity.id == activity_id
        )
        .first()
    )

    if activity is None:
        raise HTTPException(
            status_code=404,
            detail="Activity not found"
        )

    logs = (
        db.query(models.ActivityLog)
        .filter(
            models.ActivityLog.activity_id == activity_id
        )
        .all()
    )

    start_date, end_date = (
        analytics.get_month_range()
    )

    monthly_logs = (
        analytics.filter_logs_by_date(
            logs,
            start_date,
            end_date
        )
    )

    statistics = (
        analytics.calculate_activity_statistics(
            monthly_logs
        )
    )

    streaks = (
        analytics.calculate_streaks(
            monthly_logs
        )
    )

    return {
        "activity_id": activity.id,
        "activity_name": activity.name,
        **statistics,
        **streaks
    }


# GET OVERALL STATISTICS
@app.get(
    "/analytics/overview",
    response_model=schemas.OverviewStatisticsResponse
)
def get_overall_statistics(
    db: Session = Depends(get_db)
):
    activities = (
        db.query(models.Activity)
        .all()
    )

    statistics = (
        analytics.calculate_overall_statistics(
            activities
        )
    )

    return statistics


# GET DAILY ACTIVITY TRENDS
@app.get(
    "/analytics/trends/daily",
    response_model=list[schemas.DailyTrendResponse]
)
def get_daily_trends(
    db: Session = Depends(get_db)
):
    logs = (
        db.query(models.ActivityLog)
        .order_by(
            models.ActivityLog.date.asc()
        )
        .all()
    )

    trends = (
        analytics.calculate_daily_data(logs)
    )

    return trends


# GET WEEKLY ACTIVITY TRENDS
@app.get(
    "/analytics/trends/weekly",
    response_model=list[schemas.WeeklyTrendResponse]
)
def get_weekly_trends(
    db: Session = Depends(get_db)
):
    logs = (
        db.query(models.ActivityLog)
        .order_by(
            models.ActivityLog.date.asc()
        )
        .all()
    )

    trends = (
        analytics.calculate_weekly_trends(logs)
    )

    return trends


# GET CALENDAR DATA
@app.get(
    "/analytics/calendar",
    response_model=list[schemas.CalendarDayResponse]
)
def get_calendar_data(
    db: Session = Depends(get_db)
):
    logs = (
        db.query(models.ActivityLog)
        .order_by(
            models.ActivityLog.date.asc()
        )
        .all()
    )

    calendar = (
        analytics.calculate_daily_data(logs)
    )

    return calendar


# =========================================================
# SETTINGS
# =========================================================

# GET SETTINGS
@app.get(
    "/settings",
    response_model=schemas.SettingsResponse
)
def get_settings(
    db: Session = Depends(get_db)
):
    settings = (
        db.query(models.Settings)
        .filter(
            models.Settings.id == 1
        )
        .first()
    )

    # Create default settings for first run
    if settings is None:

        settings = models.Settings(
            id=1,
            name="Demo User",
            email="demo@habitflow.com",
            timezone="Asia/Kolkata",
            theme="dark",
            accent_color="purple",
            daily_reminders=True,
            reminder_time="08:00",
            week_start_day="Monday"
        )

        db.add(settings)
        db.commit()
        db.refresh(settings)

    return settings


# UPDATE SETTINGS
@app.put(
    "/settings",
    response_model=schemas.SettingsResponse
)
def update_settings(
    settings_data: schemas.SettingsUpdate,
    db: Session = Depends(get_db)
):
    settings = (
        db.query(models.Settings)
        .filter(
            models.Settings.id == 1
        )
        .first()
    )

    # Create settings row if it doesn't exist
    if settings is None:

        settings = models.Settings(
            id=1
        )

        db.add(settings)

    settings.name = settings_data.name
    settings.email = settings_data.email
    settings.timezone = settings_data.timezone
    settings.theme = settings_data.theme
    settings.accent_color = settings_data.accent_color
    settings.daily_reminders = (
        settings_data.daily_reminders
    )
    settings.reminder_time = (
        settings_data.reminder_time
    )
    settings.week_start_day = (
        settings_data.week_start_day
    )

    db.commit()
    db.refresh(settings)

    return settings