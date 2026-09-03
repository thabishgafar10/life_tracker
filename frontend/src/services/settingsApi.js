import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

export async function getSettings() {
  const response = await axios.get(`${API_BASE_URL}/settings`);
  return response.data;
}

export async function updateSettings(settings) {
  const response = await axios.put(
    `${API_BASE_URL}/settings`,
    settings
  );

  return response.data;
}