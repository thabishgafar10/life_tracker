import axios from "axios";

const API_BASE_URL = "https://life-tracker-s7de.onrender.com";

const api = axios.create({
  baseURL: API_BASE_URL,
});


// ========================================
// AUTHENTICATION
// ========================================

export function getAccessToken() {
  return localStorage.getItem("access_token");
}


export function saveAccessToken(token) {
  localStorage.setItem("access_token", token);
}


export function logoutUser() {
  localStorage.removeItem("access_token");
}


// Attach JWT to authenticated requests
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// ========================================
// NORMAL PASSWORD LOGIN
// ========================================

export async function loginUser(credentials) {
  const response = await api.post(
    "/auth/login",
    {
      username: credentials.username,
      password: credentials.password,
    }
  );

  return response.data;
}


// ========================================
// CURRENT USER
// ========================================

export async function getCurrentUser() {
  const response = await api.get("/auth/me");
  return response.data;
}


// ========================================
// OTP AUTHENTICATION
// ========================================

export async function requestOTP({
  email,
  purpose,
}) {
  const response = await api.post(
    "/auth/request-otp",
    {
      email,
      purpose,
    }
  );

  return response.data;
}


export async function verifyOTP({
  email,
  otp,
  purpose,
}) {
  const response = await api.post(
    "/auth/verify-otp",
    {
      email,
      otp,
      purpose,
    }
  );

  return response.data;
}


// ========================================
// REGISTRATION
// ========================================

export async function registerUser(userData) {
  const response = await api.post(
    "/auth/register",
    userData
  );

  return response.data;
}


// ========================================
// PASSWORD RESET
// ========================================

export async function resetPassword(resetData) {
  const response = await api.post(
    "/auth/reset-password",
    resetData
  );

  return response.data;
}


// ========================================
// ACTIVITIES
// ========================================

export async function getActivities() {
  const response = await api.get("/activities");
  return response.data;
}


export async function createActivity(activityData) {
  const response = await api.post(
    "/activities",
    activityData
  );

  return response.data;
}


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


export async function deleteActivity(activityId) {
  const response = await api.delete(
    `/activities/${activityId}`
  );

  return response.data;
}


// ========================================
// ACTIVITY LOGS
// ========================================

export async function getActivityLogs() {
  const response = await api.get("/activity-logs");
  return response.data;
}


export async function createActivityLog(logData) {
  const response = await api.post(
    "/activity-logs",
    logData
  );

  return response.data;
}


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


export async function deleteActivityLog(logId) {
  const response = await api.delete(
    `/activity-logs/${logId}`
  );

  return response.data;
}


// ========================================
// DAILY NOTES
// ========================================

export async function getDailyNotes() {
  const response = await api.get("/daily-notes");
  return response.data;
}


export async function createDailyNote(noteData) {
  const response = await api.post(
    "/daily-notes",
    noteData
  );

  return response.data;
}


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


export async function deleteDailyNote(noteId) {
  const response = await api.delete(
    `/daily-notes/${noteId}`
  );

  return response.data;
}


// ========================================
// ANALYTICS
// ========================================

export async function getOverviewStatistics() {
  const response = await api.get(
    "/analytics/overview"
  );

  return response.data;
}


export async function getActivityStatistics(
  activityId
) {
  const response = await api.get(
    `/analytics/activity/${activityId}`
  );

  return response.data;
}


export async function getActivityWeeklyStatistics(
  activityId
) {
  const response = await api.get(
    `/analytics/activity/${activityId}/weekly`
  );

  return response.data;
}


export async function getActivityMonthlyStatistics(
  activityId
) {
  const response = await api.get(
    `/analytics/activity/${activityId}/monthly`
  );

  return response.data;
}


// ========================================
// TRENDS
// ========================================

export async function getDailyTrends() {
  const response = await api.get(
    "/analytics/trends/daily"
  );

  return response.data;
}


export async function getWeeklyTrends() {
  const response = await api.get(
    "/analytics/trends/weekly"
  );

  return response.data;
}


// ========================================
// CALENDAR
// ========================================

export async function getCalendarData() {
  const response = await api.get(
    "/analytics/calendar"
  );

  return response.data;
}


export default api;