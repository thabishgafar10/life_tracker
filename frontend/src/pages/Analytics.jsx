import { useEffect, useMemo, useState } from "react";

import {
  Trophy,
  TrendingUp,
  Flame,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import {
  getActivities,
  getOverviewStatistics,
  getDailyTrends,
  getActivityStatistics,
  getCalendarData,
} from "../services/api";

import "./Analytics.css";


function Analytics() {

  const [overview, setOverview] = useState(null);
  const [dailyTrends, setDailyTrends] = useState([]);
  const [calendarData, setCalendarData] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activityStats, setActivityStats] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  /* ================================
      LOAD ALL ANALYTICS DATA
  ================================= */

  useEffect(() => {
    loadAnalytics();
  }, []);


  async function loadAnalytics() {

    try {

      setLoading(true);
      setError(null);


      const [

        overviewData,
        dailyData,
        activitiesData,
        calendar,

      ] = await Promise.all([

        getOverviewStatistics(),

        getDailyTrends(),

        getActivities(),

        getCalendarData(),

      ]);


      setOverview(overviewData || null);


      setDailyTrends(
        Array.isArray(dailyData)
          ? dailyData
          : []
      );


      setCalendarData(
        Array.isArray(calendar)
          ? calendar
          : []
      );


      const safeActivities =
        Array.isArray(activitiesData)
          ? activitiesData
          : [];


      setActivities(safeActivities);


      /* =================================
          LOAD STATISTICS FOR EVERY ACTIVITY
      ================================= */

      const statistics = await Promise.all(

        safeActivities.map(async (activity) => {

          try {

            const stats =
              await getActivityStatistics(
                activity.id
              );

            return {

              ...stats,

              id: activity.id,

              name:
                stats.activity_name ||
                activity.name,

            };

          } catch {

            return {

              id: activity.id,

              name: activity.name,

              completion_rate: 0,

              completed_logs: 0,

              missed_logs: 0,

              current_streak: 0,

              best_streak: 0,

            };

          }

        })

      );


      setActivityStats(statistics);


    } catch (err) {

      console.error(
        "Analytics loading error:",
        err
      );


      setError(

        err.response?.data?.detail ||

        err.message ||

        "Failed to load analytics."

      );

    } finally {

      setLoading(false);

    }

  }


  /* ================================
      FORMAT DAILY TREND DATA
  ================================= */

  const formattedDailyTrends = useMemo(() => {

    return dailyTrends.map((item) => {

      const date = new Date(
        `${item.date}T00:00:00`
      );


      return {

        ...item,

        label:

          date.toLocaleDateString(
            "en-US",
            {

              month: "short",

              day: "numeric",

            }
          ),

      };

    });

  }, [dailyTrends]);


  /* ================================
      BEST ACTIVITY
  ================================= */

  const bestActivity = useMemo(() => {

    if (activityStats.length === 0) {

      return null;

    }


    return [...activityStats].sort(

      (a, b) =>

        (b.completion_rate || 0) -

        (a.completion_rate || 0)

    )[0];

  }, [activityStats]);


  /* ================================
      STREAK STATISTICS
  ================================= */

  const streakStats = useMemo(() => {

    if (activityStats.length === 0) {

      return {

        longestStreak: 0,

        currentStreak: 0,

        maxMissed: 0,

      };

    }


    return {

      longestStreak:

        Math.max(

          ...activityStats.map(

            (activity) =>

              activity.best_streak || 0

          )

        ),


      currentStreak:

        Math.max(

          ...activityStats.map(

            (activity) =>

              activity.current_streak || 0

          )

        ),


      maxMissed:

        Math.max(

          ...activityStats.map(

            (activity) =>

              activity.missed_logs || 0

          )

        ),

    };

  }, [activityStats]);


  /* ================================
      HEATMAP DATA
  ================================= */

  const heatmapData = useMemo(() => {

    return calendarData.slice(-28);

  }, [calendarData]);


  /* ================================
      LOADING
  ================================= */

  if (loading) {

    return (

      <div className="analytics-loading">

        Loading analytics...

      </div>

    );

  }


  /* ================================
      ERROR
  ================================= */

  if (error) {

    return (

      <div className="analytics-error">

        <h2>
          Something went wrong
        </h2>


        <p>
          {error}
        </p>


        <button
          onClick={loadAnalytics}
        >

          Try Again

        </button>

      </div>

    );

  }


  return (

    <div className="analytics-page">


      {/* =============================
          HEADER
      ============================== */}

      <div className="analytics-header">

        <div>

          <h1>
            Analytics
          </h1>


          <p>
            Detailed insights about your habits.
          </p>

        </div>

      </div>



      {/* =============================
          TOP SUMMARY CARDS
      ============================== */}

      <section className="analytics-top-grid">


        {/* COMPLETION RATIO */}

        <div className="completion-card">

          <p>
            Completion Ratio
          </p>


          <div
            className="completion-circle"
            style={{
              "--completion-rate": `${
                Number(overview?.overall_completion_rate || 0) * 3.6
              }deg`,
            }}
          >

            <span>

              {Number(

                overview?.overall_completion_rate || 0

              ).toFixed(0)}

              %

            </span>

          </div>


          <small>
            Overall Progress
          </small>

        </div>



        {/* TOTAL COMPLETED */}

        <div className="metric-card">

          <p>
            Total Completed
          </p>


          <h2>

            {overview?.completed_logs || 0}

          </h2>


          <span>
            Completed logs
          </span>

        </div>



        {/* TOTAL ACTIVITIES */}

        <div className="metric-card">

          <p>
            Total Activities
          </p>


          <h2>

            {overview?.total_activities || 0}

          </h2>


          <span>
            Active habits
          </span>

        </div>



        {/* TOTAL LOGS */}

        <div className="metric-card">

          <p>
            Total Logs
          </p>


          <h2>

            {overview?.total_logs || 0}

          </h2>


          <span>
            Total activity records
          </span>

        </div>


      </section>



      {/* =============================
          MAIN ANALYTICS GRID
      ============================== */}

      <section className="analytics-main-grid">


        {/* ============================
            LEFT SIDE
        ============================= */}

        <div className="analytics-left-column">


          {/* COMPLETION TREND */}

          <div className="analytics-panel trend-panel">

            <div className="panel-header">

              <div>

                <h2>
                  Completion Trend
                </h2>


                <p>
                  Your consistency over time
                </p>

              </div>

            </div>


            <div className="chart-wrapper">

              {formattedDailyTrends.length === 0 ? (

                <div className="empty-state">

                  No trend data available

                </div>

              ) : (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <LineChart
                    data={formattedDailyTrends}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#273244"
                    />


                    <XAxis

                      dataKey="label"

                      stroke="#7d8797"

                      tick={{
                        fontSize: 11,
                      }}

                    />


                    <YAxis

                      domain={[0, 100]}

                      stroke="#7d8797"

                      tick={{
                        fontSize: 11,
                      }}

                    />


                    <Tooltip />


                    <Line

                      type="monotone"

                      dataKey="completion_rate"

                      stroke="#8b6cff"

                      strokeWidth={3}

                      dot={{
                        r: 4,

                        fill: "#8b6cff",

                      }}

                    />

                  </LineChart>

                </ResponsiveContainer>

              )}

            </div>

          </div>



          {/* ============================
              ACTIVITY HEATMAP
          ============================= */}

          <div className="analytics-panel heatmap-panel">

            <div className="panel-header">

              <div>

                <h2>
                  Activity Heatmap
                </h2>


                <p>
                  Your activity consistency
                </p>

              </div>

            </div>


            <div className="heatmap-grid">

              {heatmapData.length === 0 ? (

                <div className="empty-state">

                  No calendar data available

                </div>

              ) : (

                heatmapData.map((day) => (

                  <div

                    key={day.date}

                    className={`heatmap-cell ${

                      day.completion_rate === 0

                        ? "heat-0"

                        : day.completion_rate < 50

                        ? "heat-1"

                        : day.completion_rate < 100

                        ? "heat-2"

                        : "heat-3"

                    }`}

                    title={`

${day.date}

Completion: ${day.completion_rate}%

                    `}

                  />

                ))

              )}

            </div>


            <div className="heatmap-legend">

              <span>
                Less
              </span>


              <div className="legend-cell heat-0" />

              <div className="legend-cell heat-1" />

              <div className="legend-cell heat-2" />

              <div className="legend-cell heat-3" />


              <span>
                More
              </span>

            </div>

          </div>


        </div>



        {/* ============================
            RIGHT SIDE
        ============================= */}

        <div className="analytics-right-column">


          {/* HABIT COMPLETION */}

          <div className="analytics-panel habit-performance-panel">

            <div className="panel-header">

              <div>

                <h2>
                  Habit Completion
                </h2>


                <p>
                  Performance by activity
                </p>

              </div>

            </div>


            <div className="habit-bars">

              {activityStats.length === 0 ? (

                <div className="empty-state">

                  No activity data available

                </div>

              ) : (

                activityStats.map((activity) => (

                  <div

                    className="habit-bar-item"

                    key={activity.id}

                  >

                    <div className="habit-bar-top">

                      <span>

                        {activity.name}

                      </span>


                      <span>

                        {Number(

                          activity.completion_rate || 0

                        ).toFixed(0)}

                        %

                      </span>

                    </div>


                    <div className="habit-progress">

                      <div

                        className="habit-progress-fill"

                        style={{

                          width:

                            `${

                              Math.min(

                                activity.completion_rate || 0,

                                100

                              )

                            }%`,

                        }}

                      />

                    </div>

                  </div>

                ))

              )}

            </div>

          </div>



          {/* BEST PERFORMANCE */}

          <div className="analytics-panel best-performance-panel">

            <div className="panel-header">

              <div>

                <h2>
                  Best Performance
                </h2>


                <p>
                  Your strongest habit
                </p>

              </div>

            </div>


            {bestActivity ? (

              <div className="best-performance-content">

                <div className="best-icon">

                  <Trophy
                    size={28}
                  />

                </div>


                <h3>

                  {bestActivity.name}

                </h3>


                <strong>

                  {Number(

                    bestActivity.completion_rate || 0

                  ).toFixed(0)}

                  %

                </strong>


                <span>

                  Completion Rate

                </span>

              </div>

            ) : (

              <div className="empty-state">

                No activity data

              </div>

            )}

          </div>


        </div>

      </section>



      {/* =============================
          STREAK ANALYTICS
      ============================== */}

      <section className="analytics-panel streak-panel">

        <div className="panel-header">

          <div>

            <h2>
              Streak Analytics
            </h2>


            <p>
              Track your consistency streaks
            </p>

          </div>

        </div>


        <div className="streak-grid">


          <div className="streak-card">

            <Flame
              size={20}
            />


            <span>
              Longest Streak
            </span>


            <h3>

              {streakStats.longestStreak}

              <small>
                days
              </small>

            </h3>

          </div>



          <div className="streak-card">

            <TrendingUp
              size={20}
            />


            <span>
              Current Streak
            </span>


            <h3>

              {streakStats.currentStreak}

              <small>
                days
              </small>

            </h3>

          </div>



          <div className="streak-card">

            <XCircle
              size={20}
            />


            <span>
              Most Missed
            </span>


            <h3>

              {streakStats.maxMissed}

              <small>
                logs
              </small>

            </h3>

          </div>



          <div className="streak-card">

            <CheckCircle2
              size={20}
            />


            <span>
              Total Completed
            </span>


            <h3>

              {overview?.completed_logs || 0}

              <small>
                logs
              </small>

            </h3>

          </div>


        </div>

      </section>


    </div>

  );

}


export default Analytics;