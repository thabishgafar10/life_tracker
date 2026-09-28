import api from "./api";

export async function getSettings() {
  const response = await api.get("/settings");
  return response.data;
}

export async function updateSettings(settings) {
  const response = await api.put("/settings", settings);
  return response.data;
}