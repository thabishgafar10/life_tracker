import { useEffect, useState } from "react";

import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Flame,
  X,
} from "lucide-react";

import {
  getActivities,
  getActivityLogs,
  getActivityStatistics,
  createActivity,
  updateActivity,
  deleteActivity,
  createActivityLog,
} from "../services/api";


function Activities() {
  const [activities, setActivities] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activityStats, setActivityStats] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    goal: "",
  });


  /* ================================
     TODAY DATE
  ================================= */

  const today = new Date()
    .toISOString()
    .split("T")[0];


  /* ================================
     LOAD DATA
  ================================= */

  useEffect(() => {
    loadActivities();
  }, []);


  async function loadActivities() {
    try {
      setLoading(true);
      setError(null);

      const [
        activitiesData,
        logsData,
      ] = await Promise.all([
        getActivities(),
        getActivityLogs(),
      ]);

      setActivities(activitiesData);
      setLogs(logsData);


      // Load statistics for every activity

      const statistics = {};

      await Promise.all(
        activitiesData.map(async (activity) => {
          try {
            const stats =
              await getActivityStatistics(activity.id);

            statistics[activity.id] = stats;

          } catch (err) {
            console.error(
              "Failed to load statistics:",
              activity.id
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
        "Failed to load activities."
      );

    } finally {
      setLoading(false);
    }
  }


  /* ================================
     CHECK COMPLETION
  ================================= */

  function isCompletedToday(activityId) {
    return logs.some(
      (log) =>
        log.activity_id === activityId &&
        log.date === today &&
        log.completed === true
    );
  }


  /* ================================
     COMPLETE ACTIVITY
  ================================= */

  async function handleCompleteActivity(activityId) {
    try {

      if (isCompletedToday(activityId)) {
        return;
      }

      await createActivityLog({
        activity_id: activityId,
        date: today,
        completed: true,
        value: null,
        notes: null,
      });

      await loadActivities();

    } catch (err) {

      alert(
        err.response?.data?.detail ||
        err.message ||
        "Could not complete activity."
      );

    }
  }


  /* ================================
     OPEN ADD MODAL
  ================================= */

  function handleOpenAddModal() {

    setEditingActivity(null);

    setFormData({
      name: "",
      category: "",
      goal: "",
    });

    setShowModal(true);
  }


  /* ================================
     OPEN EDIT MODAL
  ================================= */

  function handleOpenEditModal(activity) {

    setEditingActivity(activity);

    setFormData({
      name: activity.name || "",
      category: activity.category || "",
      goal: activity.goal || "",
    });

    setShowModal(true);
  }


  /* ================================
     FORM CHANGE
  ================================= */

  function handleChange(event) {

    const {
      name,
      value,
    } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  }


  /* ================================
     CREATE / UPDATE ACTIVITY
  ================================= */

  async function handleSubmit(event) {

    event.preventDefault();

    try {

      if (editingActivity) {

        await updateActivity(
          editingActivity.id,
          formData
        );

      } else {

        await createActivity(formData);

      }

      setShowModal(false);

      await loadActivities();

    } catch (err) {

      alert(
        err.response?.data?.detail ||
        err.message ||
        "Could not save activity."
      );

    }
  }


  /* ================================
     DELETE ACTIVITY
  ================================= */

  async function handleDelete(activityId) {

    const confirmed = window.confirm(
      "Are you sure you want to delete this activity?"
    );

    if (!confirmed) {
      return;
    }

    try {

      await deleteActivity(activityId);

      await loadActivities();

    } catch (err) {

      alert(
        err.response?.data?.detail ||
        err.message ||
        "Could not delete activity."
      );

    }
  }


  /* ================================
     LOADING
  ================================= */

  if (loading) {
    return (
      <div className="page-loading">
        Loading activities...
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

        <button onClick={loadActivities}>
          Try Again
        </button>

      </div>
    );
  }


  return (

    <div className="activities-page">


      {/* ================= HEADER ================= */}

      <div className="activities-header">

        <div>

          <p className="section-eyebrow">
            HABIT MANAGEMENT
          </p>

          <h1>
            Your Activities
          </h1>

          <p className="activities-subtitle">
            Create, track and manage your daily activities.
          </p>

        </div>


        <button
          className="add-activity-button"
          onClick={handleOpenAddModal}
        >

          <Plus size={19} />

          Add Activity

        </button>

      </div>


      {/* ================= ACTIVITY COUNT ================= */}

      <div className="activities-summary">

        <div>

          <p>
            TOTAL ACTIVITIES
          </p>

          <h2>
            {activities.length}
          </h2>

        </div>

      </div>


      {/* ================= ACTIVITIES LIST ================= */}

      {activities.length === 0 ? (

        <div className="empty-dashboard-state">

          <h3>
            No activities yet
          </h3>

          <p>
            Create your first activity and start building better habits.
          </p>


          <button
            className="add-activity-button"
            onClick={handleOpenAddModal}
          >

            <Plus size={18} />

            Create Activity

          </button>

        </div>

      ) : (

        <div className="activities-grid">

          {activities.map((activity) => {

            const completed =
              isCompletedToday(activity.id);


            const stats =
              activityStats[activity.id];


            return (

              <div
                key={activity.id}
                className="activity-card"
              >


                {/* CARD HEADER */}

                <div className="activity-card-top">

                  <div>

                    <h2>
                      {activity.name}
                    </h2>

                    <span className="activity-category">

                      {activity.category ||
                        "Uncategorized"}

                    </span>

                  </div>


                  <div className="activity-actions">

                    <button
                      className="icon-action-button"
                      onClick={() =>
                        handleOpenEditModal(
                          activity
                        )
                      }
                    >

                      <Pencil size={16} />

                    </button>


                    <button
                      className="icon-action-button delete"
                      onClick={() =>
                        handleDelete(
                          activity.id
                        )
                      }
                    >

                      <Trash2 size={16} />

                    </button>

                  </div>

                </div>


                {/* GOAL */}

                {activity.goal && (

                  <div className="activity-goal-section">

                    <p>
                      GOAL
                    </p>

                    <span>
                      {activity.goal}
                    </span>

                  </div>

                )}


                {/* STATISTICS */}

                <div className="activity-stats">

                  <div>

                    <Flame size={17} />

                    <span>

                      {stats?.current_streak || 0}
                      {" "}
                      day streak

                    </span>

                  </div>


                  <div>

                    <span className="best-streak-label">

                      Best:
                      {" "}

                      {stats?.best_streak || 0}
                      {" "}
                      days

                    </span>

                  </div>

                </div>


                {/* COMPLETE BUTTON */}

                {completed ? (

                  <div className="activity-completed-status">

                    <CheckCircle2 size={18} />

                    Completed Today

                  </div>

                ) : (

                  <button
                    className="activity-complete-button"
                    onClick={() =>
                      handleCompleteActivity(
                        activity.id
                      )
                    }
                  >

                    <CheckCircle2 size={18} />

                    Complete Today

                  </button>

                )}

              </div>

            );

          })}

        </div>

      )}


      {/* ================= MODAL ================= */}

      {showModal && (

        <div className="modal-overlay">


          <div className="activity-modal">


            {/* MODAL HEADER */}

            <div className="modal-header">

              <h2>

                {editingActivity
                  ? "Edit Activity"
                  : "Create Activity"}

              </h2>


              <button
                className="modal-close-button"
                onClick={() =>
                  setShowModal(false)
                }
              >

                <X size={20} />

              </button>

            </div>


            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="activity-form"
            >


              {/* NAME */}

              <div className="form-group">

                <label>
                  Activity Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Example: Gym"
                  required
                />

              </div>


              {/* CATEGORY */}

              <div className="form-group">

                <label>
                  Category
                </label>

                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="Example: Health"
                />

              </div>


              {/* GOAL */}

              <div className="form-group">

                <label>
                  Goal
                </label>

                <input
                  type="text"
                  name="goal"
                  value={formData.goal}
                  onChange={handleChange}
                  placeholder="Example: Workout 5 times a week"
                />

              </div>


              {/* BUTTONS */}

              <div className="modal-buttons">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={() =>
                    setShowModal(false)
                  }
                >

                  Cancel

                </button>


                <button
                  type="submit"
                  className="save-activity-button"
                >

                  {editingActivity
                    ? "Save Changes"
                    : "Create Activity"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );
}


export default Activities;