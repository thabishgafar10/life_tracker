from datetime import date,timedelta

def calculate_completion_rate(total_logs, completed_logs):
    if total_logs == 0:
        return 0

    return (completed_logs / total_logs) * 100


def calculate_activity_statistics(logs):
    total_logs = len(logs)

    completed_logs = sum(
        1 for log in logs
        if log.completed
    )

    missed_logs = total_logs - completed_logs

    completion_rate = calculate_completion_rate(
        total_logs,
        completed_logs
    )

    return {
        "total_logs": total_logs,
        "completed_logs": completed_logs,
        "missed_logs": missed_logs,
        "completion_rate": round(completion_rate, 2)
    }

def calculate_streaks(logs):
    completed_dates = sorted(
        log.date
        for log in logs
        if log.completed
    )

    if not completed_dates:
        return {
            "current_streak": 0,
            "best_streak": 0
        }

    # Remove duplicate dates just in case
    completed_dates = sorted(set(completed_dates))

    best_streak = 1
    current_streak = 1

    for i in range(1, len(completed_dates)):
        previous_date = completed_dates[i - 1]
        current_date = completed_dates[i]

        if current_date == previous_date + timedelta(days=1):
            current_streak += 1

            if current_streak > best_streak:
                best_streak = current_streak
        else:
            current_streak = 1

    # Calculate current streak from the most recent completed day
    current_streak = 1

    for i in range(len(completed_dates) - 1, 0, -1):
        if completed_dates[i] == completed_dates[i - 1] + timedelta(days=1):
            current_streak += 1
        else:
            break

    return {
        "current_streak": current_streak,
        "best_streak": best_streak
    }

def filter_logs_by_date(logs, start_date, end_date):
    return [
        log
        for log in logs
        if start_date <= log.date <= end_date
    ]

def get_week_range(target_date=None):
    if target_date is None:
        target_date = date.today()

    start_date = target_date - timedelta(
        days=target_date.weekday()
    )

    end_date = start_date + timedelta(days=6)

    return start_date, end_date

def get_month_range(target_date=None):
    if target_date is None:
        target_date = date.today()

    start_date = target_date.replace(day=1)

    if start_date.month == 12:
        next_month = start_date.replace(
            year=start_date.year + 1,
            month=1,
            day=1
        )
    else:
        next_month = start_date.replace(
            month=start_date.month + 1,
            day=1
        )

    end_date = next_month - timedelta(days=1)

    return start_date, end_date

def calculate_overall_statistics(activities):
    total_activities = len(activities)

    total_logs = 0
    completed_logs = 0

    for activity in activities:
        for log in activity.logs:
            total_logs += 1

            if log.completed:
                completed_logs += 1

    missed_logs = total_logs - completed_logs

    completion_rate = calculate_completion_rate(
        total_logs,
        completed_logs
    )

    return {
        "total_activities": total_activities,
        "total_logs": total_logs,
        "completed_logs": completed_logs,
        "missed_logs": missed_logs,
        "overall_completion_rate": round(
            completion_rate,
            2
        )
    }

def calculate_weekly_trends(logs):
    weekly_data = {}

    for log in logs:
        year, week, _ = log.date.isocalendar()
        week_key = f"{year}-W{week:02d}"

        if week_key not in weekly_data:
            weekly_data[week_key] = {
                "total": 0,
                "completed": 0
            }

        weekly_data[week_key]["total"] += 1

        if log.completed:
            weekly_data[week_key]["completed"] += 1

    trends = []

    for week_key, data in sorted(weekly_data.items()):
        completion_rate = calculate_completion_rate(
            data["total"],
            data["completed"]
        )

        trends.append({
            "week": week_key,
            "total": data["total"],
            "completed": data["completed"],
            "completion_rate": round(
                completion_rate,
                2
            )
        })

    return trends


def calculate_daily_data(logs):
    daily_data = {}

    for log in logs:
        date_key = str(log.date)

        if date_key not in daily_data:
            daily_data[date_key] = {
                "total": 0,
                "completed": 0
            }

        daily_data[date_key]["total"] += 1

        if log.completed:
            daily_data[date_key]["completed"] += 1

    daily_results = []

    for date_key, data in sorted(daily_data.items()):
        completion_rate = calculate_completion_rate(
            data["total"],
            data["completed"]
        )

        daily_results.append({
            "date": date_key,
            "total": data["total"],
            "completed": data["completed"],
            "completion_rate": round(
                completion_rate,
                2
            )
        })

    return daily_results