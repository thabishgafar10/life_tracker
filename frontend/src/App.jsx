import { useCallback, useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Habits from "./pages/Habits";
import Analytics from "./pages/Analytics";
import Notes from "./pages/Notes";
import Settings from "./pages/Settings";

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

    const parsedSettings = JSON.parse(
      savedSettings
    );

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
      "Failed to save local settings:",
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

  /*
    Load backend settings once when the app starts.
  */
  useEffect(() => {
    async function loadSettings() {
      try {
        const backendSettings =
          await getSettings();

        const localSettings =
          getLocalSettings();

        /*
          Backend provides the account data.

          Local storage has priority for theme
          and accent color because those are the
          user's current UI preferences.
        */
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

        /*
          Store the final settings locally so the
          same theme is restored after refresh.
        */
        saveLocalSettings(loadedSettings);
      } catch (error) {
        console.error(
          "Failed to load settings:",
          error
        );

        /*
          If backend isn't available, keep using
          the locally saved settings.
        */
      } finally {
        setSettingsLoaded(true);
      }
    }

    loadSettings();
  }, []);

  /*
    Called whenever Settings changes the UI
    preferences.
  */
  const handleSettingsUpdated = useCallback(
    (updatedSettings) => {
      setSettings((currentSettings) => {
        const newSettings = {
          ...currentSettings,
          ...updatedSettings,
        };

        /*
          Persist immediately in the browser.
        */
        saveLocalSettings(newSettings);

        return newSettings;
      });
    },
    []
  );

  /*
    Dashboard theme toggle.
  */
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

      <div
        className="app-layout"
        data-theme={settings.theme}
        data-accent={settings.accent_color}
      >

        <Sidebar />

        <main className="main-content">

          <Routes>

            <Route
              path="/"
              element={
                <Dashboard
                  theme={settings.theme}
                  toggleTheme={toggleTheme}
                />
              }
            />

            <Route
              path="/habits"
              element={<Habits />}
            />

            <Route
              path="/analytics"
              element={<Analytics />}
            />

            <Route
              path="/notes"
              element={<Notes />}
            />

            <Route
              path="/settings"
              element={
                <Settings
                  settings={settings}
                  settingsLoaded={settingsLoaded}
                  onSettingsUpdated={
                    handleSettingsUpdated
                  }
                />
              }
            />

          </Routes>

        </main>

      </div>

    </BrowserRouter>
  );
}

export default App;