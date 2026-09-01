import { useEffect, useState } from "react";

import {
  Bell,
  Plus,
  Activity,
  CheckCircle2,
  Flame,
  Trophy,
  TrendingUp,
} from "lucide-react";

import {
  getActivities,
  getActivityLogs,
  getOverviewStatistics,
  getActivityStatistics,
  getCalendarData,
  createActivityLog,
} from "../services/api";


function Dashboard() {
  const [activities, setActivities] = useState([]);
  const [logs, setLogs] = useState([]);
  const [overview, setOverview] = useState(null);
  const [calendarData, setCalendarData] = useState([]);

  const [activityStats, setActivityStats] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  /* ================================
     LOAD REAL DATABASE DATA
  ================================= */

  useEffect(() => {
    loadDashboard();
  }, []);


  async function loadDashboard() {
    try {
      setLoading(true);
      setError(null);

      const [
        activitiesData,
        logsData,
        overviewData,
        calendarResponse,
      ] = await Promise.all([
        getActivities(),
        getActivityLogs(),
        getOverviewStatistics(),
        getCalendarData(),
      ]);

      setActivities(activitiesData);
      setLogs(logsData);
      setOverview(overviewData);
      setCalendarData(calendarResponse);


      /* ================================
         LOAD STATISTICS FOR ACTIVITIES
      ================================= */

      const statistics = {};

      await Promise.all(
        activitiesData.map(async (activity) => {
          try {
            const stats = await getActivityStatistics(
              activity.id
            );

            statistics[activity.id] = stats;

          } catch (err) {
            console.error(
              "Failed to load activity statistics:",
              activity.id,
              err
            );
          }
        })
      );

      setActivityStats(statistics);

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        err.message ||
        "Failed to load dashboard."
      );

    } finally {
      setLoading(false);
    }
  }


  /* ================================
     TODAY
  ================================= */

  const today = new Date()
    .toISOString()
    .split("T")[0];


  const todayLogs = logs.filter(
    (log) => log.date === today
  );


  const completedTodayLogs = todayLogs.filter(
    (log) => log.completed === true
  );


  const completedToday =
    completedTodayLogs.length;


  /* ================================
     STREAK CALCULATION
  ================================= */

  const allStats =
    Object.values(activityStats);


  const currentStreak =
    allStats.length > 0
      ? Math.max(
          ...allStats.map(
            (stat) =>
              stat.current_streak || 0
          )
        )
      : 0;


  const bestStreak =
    allStats.length > 0
      ? Math.max(
          ...allStats.map(
            (stat) =>
              stat.best_streak || 0
          )
        )
      : 0;


  /* ================================
     COMPLETE ACTIVITY
  ================================= */

  async function handleCompleteActivity(
    activityId
  ) {
    try {
      await createActivityLog({
        activity_id: activityId,
        date: today,
        completed: true,
        value: null,
        notes: null,
      });

      // Reload real database data
      await loadDashboard();

    } catch (err) {
      alert(
        err.response?.data?.detail ||
        err.message ||
        "Could not complete activity."
      );
    }
  }


  /* ================================
     CALENDAR HELPERS
  ================================= */

  const calendarMap = {};

  calendarData.forEach((day) => {
    calendarMap[day.date] = day;
  });


  function getLastSevenDays() {
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();

      date.setDate(
        date.getDate() - i
      );

      const formattedDate =
        date.toISOString().split("T")[0];

      days.push({
        date: formattedDate,

        dayName:
          date.toLocaleDateString(
            "en-US",
            {
              weekday: "short",
            }
          ),

        dayNumber:
          date.getDate(),
      });
    }

    return days;
  }


  const lastSevenDays =
    getLastSevenDays();


  /* ================================
     LOADING
  ================================= */

  if (loading) {
    return (
      <div className="page-loading">
        Loading your dashboard...
      </div>
    );
  }


  /* ================================
     ERROR
  ================================= */

  if (error) {
    return (
      <div className="page-error">

        <h2>
          Something went wrong
        </h2>

        <p>
          {error}
        </p>

        <button
          onClick={loadDashboard}
        >
          Try Again
        </button>

      </div>
    );
  }


  return (
    <div className="dashboard-page">

      {/* ================= HEADER ================= */}

      <header className="dashboard-topbar">

        <div>

          <p className="welcome-text">
            WELCOME BACK
          </p>

          <h1>
            Track your progress.
            <br />
            Build your life.
          </h1>

          <p className="dashboard-date">
            {new Date().toLocaleDateString(
              "en-US",
              {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              }
            )}
          </p>

        </div>


        <div className="dashboard-actions">

          <button
            className="notification-button"
            type="button"
          >
            <Bell size={20} />
          </button>


          <button
            className="add-activity-button"
            type="button"
            onClick={() =>
              document
                .getElementById(
                  "activities-section"
                )
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >

            <Plus size={19} />

            Add Activity

          </button>

        </div>

      </header>


      {/* ================= STATISTICS ================= */}

      <section className="dashboard-stats-grid">

        {/* Total Activities */}

        <div className="dashboard-stat-card">

          <div className="stat-icon">
            <Activity size={20} />
          </div>

          <div>

            <p>
              Total Activities
            </p>

            <h2>
              {overview?.total_activities ?? 0}
            </h2>

          </div>

        </div>


        {/* Completed Today */}

        <div className="dashboard-stat-card">

          <div className="stat-icon">
            <CheckCircle2 size={20} />
          </div>

          <div>

            <p>
              Completed Today
            </p>

            <h2>
              {completedToday}
            </h2>

          </div>

        </div>


        {/* Current Streak */}

        <div className="dashboard-stat-card">

          <div className="stat-icon">
            <Flame size={20} />
          </div>

          <div>

            <p>
              Current Streak
            </p>

            <h2>
              {currentStreak} days
            </h2>

          </div>

        </div>


        {/* Best Streak */}

        <div className="dashboard-stat-card">

          <div className="stat-icon">
            <Trophy size={20} />
          </div>

          <div>

            <p>
              Best Streak
            </p>

            <h2>
              {bestStreak} days
            </h2>

          </div>

        </div>


        {/* Completion Rate */}

        <div className="dashboard-stat-card">

          <div className="stat-icon">
            <TrendingUp size={20} />
          </div>

          <div>

            <p>
              Completion Rate
            </p>

            <h2>
              {overview?.overall_completion_rate ?? 0}%
            </h2>

          </div>

        </div>

      </section>


      {/* ================= MAIN DASHBOARD GRID ================= */}

      <section className="dashboard-main-grid">


        {/* ================= TODAY ACTIVITIES ================= */}

        <div
          id="activities-section"
          className="dashboard-content-card activities-dashboard-card"
        >

          <div className="card-header">

            <div>

              <p className="section-eyebrow">
                TODAY
              </p>

              <h2>
                Today's Activities
              </h2>

            </div>


            <span className="activity-count">
              {activities.length} Activities
            </span>

          </div>


          {activities.length === 0 ? (

            <div className="empty-dashboard-state">

              <p>
                No activities yet.
                Create your first activity
                to start tracking.
              </p>

            </div>

          ) : (

            <div className="today-activities-list">

              {activities.map(
                (activity) => {

                  const completed =
                    todayLogs.some(
                      (log) =>
                        log.activity_id ===
                          activity.id &&
                        log.completed === true
                    );

                  return (

                    <div
                      key={activity.id}
                      className="today-activity-item"
                    >

                      <div className="activity-item-left">

                        <div
                          className={`activity-status ${
                            completed
                              ? "completed"
                              : ""
                          }`}
                        >
                          <CheckCircle2 size={20} />
                        </div>


                        <div>

                          <h3>
                            {activity.name}
                          </h3>

                          <p>
                            {activity.category ||
                              "Uncategorized"}
                          </p>

                        </div>

                      </div>


                      <div className="activity-item-right">

                        {activity.goal && (

                          <span className="activity-goal">
                            {activity.goal}
                          </span>

                        )}


                        {completed ? (

                          <span className="completed-label">
                            Completed
                          </span>

                        ) : (

                          <button
                            className="complete-button"
                            type="button"
                            onClick={() =>
                              handleCompleteActivity(
                                activity.id
                              )
                            }
                          >
                            Complete
                          </button>

                        )}

                      </div>

                    </div>

                  );

                }
              )}

            </div>

          )}

        </div>


        {/* ================= CALENDAR ================= */}

        <div className="dashboard-content-card calendar-dashboard-card">

          <div className="card-header">

            <div>

              <p className="section-eyebrow">
                OVERVIEW
              </p>

              <h2>
                This Week
              </h2>

            </div>

          </div>


          <div className="mini-calendar">

            {lastSevenDays.map((day) => {

              const dayData =
                calendarMap[day.date];

              const completionRate =
                dayData?.completion_rate ?? 0;


              let statusClass =
                "calendar-day-empty";


              if (
                completionRate === 100
              ) {
                statusClass =
                  "calendar-day-complete";
              } else if (
                completionRate > 0
              ) {
                statusClass =
                  "calendar-day-partial";
              }


              return (

                <div
                  key={day.date}
                  className="calendar-day-wrapper"
                >

                  <span className="calendar-day-name">
                    {day.dayName}
                  </span>


                  <div
                    className={`calendar-day ${statusClass}`}
                  >
                    {day.dayNumber}
                  </div>

                </div>

              );

            })}

          </div>


          <div className="calendar-legend">

            <div>

              <span className="legend-dot complete-dot" />

              Completed

            </div>


            <div>

              <span className="legend-dot partial-dot" />

              Partial

            </div>


            <div>

              <span className="legend-dot empty-dot" />

              No Data

            </div>

          </div>

        </div>


        {/* ================= STREAK ================= */}

        <div className="dashboard-content-card streak-dashboard-card">

          <div className="streak-icon">

            <Flame size={30} />

          </div>


          <p className="section-eyebrow">
            CURRENT STREAK
          </p>


          <h2>
            {currentStreak} Days
          </h2>


          <p className="streak-description">

            Your best streak is{" "}

            <strong>
              {bestStreak} days
            </strong>

          </p>


          <div className="streak-progress">

            <div
              className="streak-progress-fill"
              style={{
                width: `${
                  bestStreak > 0
                    ? Math.min(
                        (
                          currentStreak /
                          bestStreak
                        ) * 100,
                        100
                      )
                    : 0
                }%`,
              }}
            />

          </div>

        </div>

      </section>


      {/* ================= DATABASE SUMMARY ================= */}

      <section className="dashboard-summary-grid">

        <div className="summary-item">

          <span>
            Total Logs
          </span>

          <strong>
            {overview?.total_logs ?? 0}
          </strong>

        </div>


        <div className="summary-item">

          <span>
            Completed
          </span>

          <strong>
            {overview?.completed_logs ?? 0}
          </strong>

        </div>


        <div className="summary-item">

          <span>
            Missed
          </span>

          <strong>
            {overview?.missed_logs ?? 0}
          </strong>

        </div>

      </section>

    </div>
  );
}


export default Dashboard;