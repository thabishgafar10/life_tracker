import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Activity,
  CheckCircle2,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
} from "lucide-react";

import {
  getActivities,
  getActivityLogs,
  getOverviewStatistics,
  getActivityStatistics,
  createActivityLog,
  updateActivityLog,
  deleteActivityLog,
} from "../services/api";

function Dashboard() {
  /* =========================================
     STATE
  ========================================== */

  const [activities, setActivities] = useState([]);
  const [logs, setLogs] = useState([]);
  const [overview, setOverview] = useState(null);
  const [activityStats, setActivityStats] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [updatingCell, setUpdatingCell] = useState(null);

  const navigate = useNavigate();

  /* =========================================
     SELECTED MONTH
  ========================================== */

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();

    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  /* =========================================
     DATE HELPER
  ========================================== */

  function formatDate(date) {
    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  /* =========================================
     TODAY
  ========================================== */

  const todayString = formatDate(new Date());

  function isFutureDate(dateString) {
    return dateString > todayString;
  }

  /* =========================================
     LOAD DASHBOARD DATA
  ========================================== */

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError(null);

      const [activitiesData, logsData, overviewData] =
        await Promise.all([
          getActivities(),
          getActivityLogs(),
          getOverviewStatistics(),
        ]);

      const safeActivities = Array.isArray(activitiesData)
        ? activitiesData
        : [];

      const safeLogs = Array.isArray(logsData) ? logsData : [];

      setActivities(safeActivities);
      setLogs(safeLogs);
      setOverview(overviewData || null);

      /* =====================================
         LOAD ACTIVITY STATISTICS
      ====================================== */

      const statistics = {};

      await Promise.all(
        safeActivities.map(async (activity) => {
          try {
            const stats = await getActivityStatistics(activity.id);

            statistics[activity.id] = stats;
          } catch (err) {
            console.error(
              `Failed to load statistics for activity ${activity.id}`,
              err
            );

            statistics[activity.id] = {
              best_streak: 0,
            };
          }
        })
      );

      setActivityStats(statistics);
    } catch (err) {
      console.error("Dashboard loading error:", err);

      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================
     MONTH INFORMATION
  ========================================== */

  const daysInMonth = useMemo(() => {
    return new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      0
    ).getDate();
  }, [selectedDate]);

  const monthDays = useMemo(() => {
    return Array.from(
      { length: daysInMonth },
      (_, index) => index + 1
    );
  }, [daysInMonth]);

  const selectedMonthLabel = selectedDate.toLocaleDateString(
    "en-US",
    {
      month: "long",
      year: "numeric",
    }
  );

  /* =========================================
     CHECK IF CURRENT MONTH
  ========================================== */

  const isCurrentMonth = useMemo(() => {
    const today = new Date();

    return (
      selectedDate.getFullYear() === today.getFullYear() &&
      selectedDate.getMonth() === today.getMonth()
    );
  }, [selectedDate]);

  /* =========================================
     MONTH NAVIGATION
  ========================================== */

  function goToPreviousMonth() {
    setSelectedDate(
      (currentDate) =>
        new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - 1,
          1
        )
    );
  }

  function goToNextMonth() {
    if (isCurrentMonth) {
      return;
    }

    setSelectedDate(
      (currentDate) =>
        new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          1
        )
    );
  }

  /* =========================================
     FILTER SELECTED MONTH LOGS
  ========================================== */

  const selectedMonthLogs = useMemo(() => {
    const year = selectedDate.getFullYear();

    const month = String(
      selectedDate.getMonth() + 1
    ).padStart(2, "0");

    const monthPrefix = `${year}-${month}`;

    return logs.filter((log) =>
      log.date?.startsWith(monthPrefix)
    );
  }, [logs, selectedDate]);

  /* =========================================
     CREATE LOG MAP
  ========================================== */

  const logMap = useMemo(() => {
    const map = {};

    selectedMonthLogs.forEach((log) => {
      const key = `${log.activity_id}-${log.date}`;

      map[key] = log;
    });

    return map;
  }, [selectedMonthLogs]);

  /* =========================================
     ACTIVITY MONTH STATISTICS
  ========================================== */

  function getActivityMonthStats(activityId) {
    const activityLogs = selectedMonthLogs.filter(
      (log) => log.activity_id === activityId
    );

    const completed = activityLogs.filter(
      (log) => log.completed === true
    ).length;

    const missed = activityLogs.filter(
      (log) => log.completed === false
    ).length;

    const today = new Date();

    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    const selectedYear = selectedDate.getFullYear();
    const selectedMonth = selectedDate.getMonth();

    let availableDays;

    /* Current month → days passed so far */
    if (
      selectedYear === currentYear &&
      selectedMonth === currentMonth
    ) {
      availableDays = today.getDate();
    } else {
      /* Previous month → all days */
      availableDays = daysInMonth;
    }

    const progress =
      availableDays > 0
        ? (completed / availableDays) * 100
        : 0;

    return {
      completed,
      missed,
      totalLogged: activityLogs.length,
      availableDays,
      progress,
    };
  }

  /* =========================================
     BEST STREAK
  ========================================== */

  const bestStreak = useMemo(() => {
    const allStats = Object.values(activityStats);

    if (allStats.length === 0) {
      return 0;
    }

    return Math.max(
      ...allStats.map(
        (stat) => Number(stat?.best_streak) || 0
      )
    );
  }, [activityStats]);

  /* =========================================
     HANDLE CELL CLICK
  ========================================== */

  async function handleCellClick(
    activity,
    dateString,
    existingLog
  ) {
    /* Don't allow future dates */

    if (isFutureDate(dateString)) {
      return;
    }

    const cellKey = `${activity.id}-${dateString}`;

    /* Prevent double clicking */

    if (updatingCell === cellKey) {
      return;
    }

    try {
      setUpdatingCell(cellKey);

      /* =====================================
         EMPTY → COMPLETED
      ====================================== */

      if (!existingLog) {
        const newLog = await createActivityLog({
          activity_id: activity.id,
          date: dateString,
          completed: true,
          value: "",
          notes: "",
        });

        setLogs((currentLogs) => [
          ...currentLogs,
          newLog,
        ]);

        return;
      }

      /* =====================================
         COMPLETED → MISSED
      ====================================== */

      if (existingLog.completed === true) {
        const updatedLog = await updateActivityLog(
          existingLog.id,
          {
            activity_id: activity.id,
            date: dateString,
            completed: false,
            value: existingLog.value || "",
            notes: existingLog.notes || "",
          }
        );

        setLogs((currentLogs) =>
          currentLogs.map((log) =>
            log.id === updatedLog.id
              ? updatedLog
              : log
          )
        );

        return;
      }

      /* =====================================
         MISSED → EMPTY
      ====================================== */

      await deleteActivityLog(existingLog.id);

      setLogs((currentLogs) =>
        currentLogs.filter(
          (log) => log.id !== existingLog.id
        )
      );
    } catch (err) {
      console.error(
        "Failed to update activity log:",
        err
      );

      alert(
        err.response?.data?.detail ||
          err.message ||
          "Failed to update activity."
      );
    } finally {
      setUpdatingCell(null);
    }
  }

  /* =========================================
     LOADING
  ========================================== */

  if (loading) {
    return (
      <div className="page-loading">
        Loading your habit tracker...
      </div>
    );
  }

  /* =========================================
     ERROR
  ========================================== */

  if (error) {
    return (
      <div className="page-error">
        <h2>Something went wrong</h2>

        <p>{error}</p>

        <button onClick={loadDashboard}>
          Try Again
        </button>
      </div>
    );
  }

  /* =========================================
     RENDER
  ========================================== */

  return (
    <div className="habit-dashboard">

      {/* =====================================
          HEADER
      ====================================== */}

      <header className="habit-dashboard-header">
        <div>
          <h1>Dashboard</h1>

          <p>
            Track your progress and build consistency.
          </p>
        </div>

        <button
          className="manage-habits-button"
          type="button"
          onClick={() => navigate("/activities")}
        >
          Manage Habits
        </button>
      </header>

      {/* =====================================
          SUMMARY CARDS
      ====================================== */}

      <section className="habit-summary-grid">

        {/* TOTAL HABITS */}

        <div className="habit-summary-card">
          <div className="summary-card-top">
            <p>Total Active Habits</p>

            <Activity size={18} />
          </div>

          <h2>
            {overview?.total_activities ?? 0}
          </h2>
        </div>

        {/* GLOBAL COMPLETION */}

        <div className="habit-summary-card">
          <div className="summary-card-top">
            <p>Global Completion</p>

            <CheckCircle2 size={18} />
          </div>

          <h2>
            {Number(
              overview?.overall_completion_rate ?? 0
            ).toFixed(2)}
            %
          </h2>
        </div>

        {/* BEST STREAK */}

        <div className="habit-summary-card">
          <div className="summary-card-top">
            <p>Best Streak</p>

            <Trophy size={18} />
          </div>

          <h2>
            {bestStreak} Days
          </h2>
        </div>

      </section>

      {/* =====================================
          HABIT TRACKER
      ====================================== */}

      <section className="habit-tracker-section">

        {/* TRACKER HEADER */}

        <div className="habit-tracker-header">

          <div>
            <h2>Habit Tracker</h2>

            <p>
              Click a day to update your habit status.
            </p>
          </div>

          {/* MONTH NAVIGATION */}

          <div className="month-navigation">

            <button
              type="button"
              onClick={goToPreviousMonth}
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>

            <span>
              {selectedMonthLabel}
            </span>

            <button
              type="button"
              onClick={goToNextMonth}
              aria-label="Next month"
              disabled={isCurrentMonth}
              className={
                isCurrentMonth
                  ? "month-button-disabled"
                  : ""
              }
            >
              <ChevronRight size={18} />
            </button>

          </div>

        </div>

        {/* TABLE */}

        <div className="habit-tracker-scroll">

          <table className="habit-tracker-table">

            <thead>

              <tr>

                <th className="habit-name-column">
                  Habit
                </th>

                {/* DAYS */}

                {monthDays.map((day) => {
                  const date = new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth(),
                    day
                  );

                  const weekday =
                    date.toLocaleDateString(
                      "en-US",
                      {
                        weekday: "short",
                      }
                    );

                  const dateString = formatDate(date);

                  const isToday =
                    dateString === todayString;

                  return (
                    <th
                      key={day}
                      className={`day-column ${
                        isToday
                          ? "today-column"
                          : ""
                      }`}
                    >
                      <span>
                        {weekday.charAt(0)}
                      </span>

                      <strong>
                        {day}
                      </strong>
                    </th>
                  );
                })}

                <th>Done</th>

                <th>Missed</th>

                <th>Progress</th>

              </tr>

            </thead>

            <tbody>

              {activities.length === 0 ? (

                <tr>
                  <td
                    colSpan={daysInMonth + 4}
                    className="tracker-empty-state"
                  >
                    No habits found.
                  </td>
                </tr>

              ) : (

                activities.map((activity) => {
                  const stats =
                    getActivityMonthStats(activity.id);

                  return (

                    <tr key={activity.id}>

                      {/* HABIT NAME */}

                      <td className="habit-name-cell">

                        <div className="habit-info">

                          <span className="habit-dot" />

                          <div>
                            <strong>
                              {activity.name}
                            </strong>

                            <small>
                              {activity.category ||
                                "Uncategorized"}
                            </small>
                          </div>

                        </div>

                      </td>

                      {/* DAILY LOGS */}

                      {monthDays.map((day) => {
                        const date = new Date(
                          selectedDate.getFullYear(),
                          selectedDate.getMonth(),
                          day
                        );

                        const formattedDate =
                          formatDate(date);

                        const key =
                          `${activity.id}-${formattedDate}`;

                        const log = logMap[key];

                        const future =
                          isFutureDate(formattedDate);

                        const isUpdating =
                          updatingCell === key;

                        const isToday =
                          formattedDate === todayString;

                        /* EMPTY */

                        if (!log) {
                          return (
                            <td key={formattedDate}>
                              <button
                                type="button"
                                disabled={
                                  future || isUpdating
                                }
                                onClick={() =>
                                  handleCellClick(
                                    activity,
                                    formattedDate,
                                    null
                                  )
                                }
                                className={`tracker-cell tracker-empty
                                  ${
                                    future
                                      ? "tracker-future"
                                      : ""
                                  }
                                  ${
                                    isToday
                                      ? "tracker-today"
                                      : ""
                                  }
                                `}
                              />
                            </td>
                          );
                        }

                        /* COMPLETED */

                        if (log.completed === true) {
                          return (
                            <td key={formattedDate}>
                              <button
                                type="button"
                                disabled={
                                  future || isUpdating
                                }
                                onClick={() =>
                                  handleCellClick(
                                    activity,
                                    formattedDate,
                                    log
                                  )
                                }
                                className={`tracker-cell tracker-completed
                                  ${
                                    isToday
                                      ? "tracker-today"
                                      : ""
                                  }
                                `}
                              >
                                <Check size={13} />
                              </button>
                            </td>
                          );
                        }

                        /* MISSED */

                        return (
                          <td key={formattedDate}>
                            <button
                              type="button"
                              disabled={
                                future || isUpdating
                              }
                              onClick={() =>
                                handleCellClick(
                                  activity,
                                  formattedDate,
                                  log
                                )
                              }
                              className={`tracker-cell tracker-missed
                                ${
                                  isToday
                                    ? "tracker-today"
                                    : ""
                                }
                              `}
                            >
                              <X size={13} />
                            </button>
                          </td>
                        );
                      })}

                      {/* DONE */}

                      <td className="tracker-number">
                        {stats.completed}
                      </td>

                      {/* MISSED */}

                      <td className="tracker-number">
                        {stats.missed}
                      </td>

                      {/* PROGRESS */}

                      <td className="tracker-progress-cell">

                        <div className="tracker-progress">

                          <div className="tracker-progress-bar">

                            <div
                              style={{
                                width: `${Math.round(
                                  stats.progress
                                )}%`,
                              }}
                            />

                          </div>

                          <span>
                            {Math.round(stats.progress)}%
                          </span>

                        </div>

                      </td>

                    </tr>
                  );
                })
              )}

            </tbody>

          </table>

        </div>

      </section>

      {/* =====================================
          LEGEND
      ====================================== */}

      <div className="tracker-legend">

        <div>
          <span className="legend-box legend-completed">
            <Check size={12} />
          </span>

          Completed
        </div>

        <div>
          <span className="legend-box legend-missed">
            <X size={12} />
          </span>

          Missed
        </div>

        <div>
          <span className="legend-box legend-empty" />

          No Data
        </div>

      </div>

    </div>
  );
}

export default Dashboard;