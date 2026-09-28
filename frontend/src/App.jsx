import { useCallback, useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";

import Dashboard from "./pages/Dashboard";
import Habits from "./pages/Habits";
import Analytics from "./pages/Analytics";
import Notes from "./pages/Notes";
import Settings from "./pages/Settings";

import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOTP from "./pages/VerifyOTP";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import { getSettings } from "./services/settingsApi";

import "./App.css";

const DEFAULT_SETTINGS = {
  name: "Demo User",
  email: "demo@habitflow.com",
  timezone: "Asia/Kolkata",
  theme: "dark",
  accent_color: "purple",
  daily_reminders: true,
  reminder_time: "08:00",
  week_start_day: "Monday",
};

function getLocalSettings() {
  try {
    const savedSettings = localStorage.getItem(
      "life_tracker_settings"
    );

    if (!savedSettings) {
      return null;
    }

    const parsedSettings = JSON.parse(savedSettings);

    return {
      ...DEFAULT_SETTINGS,
      ...parsedSettings,
    };
  } catch (error) {
    console.error(
      "Failed to read local settings:",
      error
    );

    return null;
  }
}

function saveLocalSettings(settings) {
  try {
    localStorage.setItem(
      "life_tracker_settings",
      JSON.stringify(settings)
    );
  } catch (error) {
    console.error(
      "Failed to save settings:",
      error
    );
  }
}

function App() {
  const [settings, setSettings] = useState(() => {
    return getLocalSettings() || DEFAULT_SETTINGS;
  });

  const [settingsLoaded, setSettingsLoaded] =
    useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const backendSettings =
          await getSettings();

        const localSettings =
          getLocalSettings();

        const loadedSettings = {
          name:
            backendSettings.name ??
            DEFAULT_SETTINGS.name,

          email:
            backendSettings.email ??
            DEFAULT_SETTINGS.email,

          timezone:
            backendSettings.timezone ??
            DEFAULT_SETTINGS.timezone,

          theme:
            localSettings?.theme ??
            backendSettings.theme ??
            DEFAULT_SETTINGS.theme,

          accent_color:
            localSettings?.accent_color ??
            backendSettings.accent_color ??
            DEFAULT_SETTINGS.accent_color,

          daily_reminders:
            backendSettings.daily_reminders ??
            DEFAULT_SETTINGS.daily_reminders,

          reminder_time:
            backendSettings.reminder_time ??
            DEFAULT_SETTINGS.reminder_time,

          week_start_day:
            backendSettings.week_start_day ??
            DEFAULT_SETTINGS.week_start_day,
        };

        setSettings(loadedSettings);
        saveLocalSettings(loadedSettings);
      } catch (error) {
        console.error(
          "Failed to load settings:",
          error
        );
      } finally {
        setSettingsLoaded(true);
      }
    }

    loadSettings();
  }, []);

  const handleSettingsUpdated = useCallback(
    (updatedSettings) => {
      setSettings((currentSettings) => {
        const newSettings = {
          ...currentSettings,
          ...updatedSettings,
        };

        saveLocalSettings(newSettings);

        return newSettings;
      });
    },
    []
  );

  const toggleTheme = useCallback(() => {
    setSettings((currentSettings) => {
      const newSettings = {
        ...currentSettings,
        theme:
          currentSettings.theme === "dark"
            ? "light"
            : "dark",
      };

      saveLocalSettings(newSettings);

      return newSettings;
    });
  }, []);

  return (
    <BrowserRouter>
      <Routes>

        {/* =========================
            PUBLIC AUTH ROUTES
        ========================= */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/verify-otp"
          element={<VerifyOTP />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />


        {/* =========================
            PROTECTED APPLICATION
        ========================= */}

        <Route element={<ProtectedRoute />}>
          <Route
            path="/"
            element={
              <div
                className="app-layout"
                data-theme={settings.theme}
                data-accent={settings.accent_color}
              >
                <Sidebar />

                <main className="main-content">
                  <Dashboard
                    theme={settings.theme}
                    toggleTheme={toggleTheme}
                  />
                </main>
              </div>
            }
          />

          <Route
            path="/habits"
            element={
              <div
                className="app-layout"
                data-theme={settings.theme}
                data-accent={settings.accent_color}
              >
                <Sidebar />

                <main className="main-content">
                  <Habits />
                </main>
              </div>
            }
          />

          <Route
            path="/analytics"
            element={
              <div
                className="app-layout"
                data-theme={settings.theme}
                data-accent={settings.accent_color}
              >
                <Sidebar />

                <main className="main-content">
                  <Analytics />
                </main>
              </div>
            }
          />

          <Route
            path="/notes"
            element={
              <div
                className="app-layout"
                data-theme={settings.theme}
                data-accent={settings.accent_color}
              >
                <Sidebar />

                <main className="main-content">
                  <Notes />
                </main>
              </div>
            }
          />

          <Route
            path="/settings"
            element={
              <div
                className="app-layout"
                data-theme={settings.theme}
                data-accent={settings.accent_color}
              >
                <Sidebar />

                <main className="main-content">
                  <Settings
                    settings={settings}
                    settingsLoaded={settingsLoaded}
                    onSettingsUpdated={
                      handleSettingsUpdated
                    }
                  />
                </main>
              </div>
            }
          />

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;