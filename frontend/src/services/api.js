import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
});


/* ================================
   ACTIVITIES
================================ */

// Get all activities
export async function getActivities() {
  const response = await api.get("/activities");
  return response.data;
}


// Create activity
export async function createActivity(activityData) {
  const response = await api.post(
    "/activities",
    activityData
  );

  return response.data;
}


// Update activity
export async function updateActivity(
  activityId,
  activityData
) {
  const response = await api.put(
    `/activities/${activityId}`,
    activityData
  );

  return response.data;
}


// Delete activity
export async function deleteActivity(activityId) {
  const response = await api.delete(
    `/activities/${activityId}`
  );

  return response.data;
}


/* ================================
   ACTIVITY LOGS
================================ */

// Get all activity logs
export async function getActivityLogs() {
  const response = await api.get("/activity-logs");
  return response.data;
}


// Create activity log
export async function createActivityLog(logData) {
  const response = await api.post(
    "/activity-logs",
    logData
  );

  return response.data;
}


// Update activity log
export async function updateActivityLog(
  logId,
  logData
) {
  const response = await api.put(
    `/activity-logs/${logId}`,
    logData
  );

  return response.data;
}


// Delete activity log
export async function deleteActivityLog(logId) {
  const response = await api.delete(
    `/activity-logs/${logId}`
  );

  return response.data;
}


/* ================================
   DAILY NOTES
================================ */

// Get all daily notes
export async function getDailyNotes() {
  const response = await api.get("/daily-notes");
  return response.data;
}


// Create daily note
export async function createDailyNote(noteData) {
  const response = await api.post(
    "/daily-notes",
    noteData
  );

  return response.data;
}


// Update daily note
export async function updateDailyNote(
  noteId,
  noteData
) {
  const response = await api.put(
    `/daily-notes/${noteId}`,
    noteData
  );

  return response.data;
}


// Delete daily note
export async function deleteDailyNote(noteId) {
  const response = await api.delete(
    `/daily-notes/${noteId}`
  );

  return response.data;
}


/* ================================
   ANALYTICS
================================ */

// Dashboard overview statistics
export async function getOverviewStatistics() {
  const response = await api.get(
    "/analytics/overview"
  );

  return response.data;
}


// Statistics for one activity
export async function getActivityStatistics(
  activityId
) {
  const response = await api.get(
    `/analytics/activity/${activityId}`
  );

  return response.data;
}


// Weekly statistics for one activity
export async function getActivityWeeklyStatistics(
  activityId
) {
  const response = await api.get(
    `/analytics/activity/${activityId}/weekly`
  );

  return response.data;
}


// Monthly statistics for one activity
export async function getActivityMonthlyStatistics(
  activityId
) {
  const response = await api.get(
    `/analytics/activity/${activityId}/monthly`
  );

  return response.data;
}


/* ================================
   TRENDS
================================ */

// Daily completion trends
export async function getDailyTrends() {
  const response = await api.get(
    "/analytics/trends/daily"
  );

  return response.data;
}


// Weekly completion trends
export async function getWeeklyTrends() {
  const response = await api.get(
    "/analytics/trends/weekly"
  );

  return response.data;
}


/* ================================
   CALENDAR
================================ */

// Calendar activity data
export async function getCalendarData() {
  const response = await api.get(
    "/analytics/calendar"
  );

  return response.data;
}


export default api;