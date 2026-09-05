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

const accentValues = {
  purple: "#8b5cf6",
  blue: "#3b82f6",
  green: "#22c55e",
  yellow: "#eab308",
  pink: "#ec4899",
};

function App() {
  const [theme, setTheme] = useState("dark");
  const [accentColor, setAccentColor] = useState("purple");

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSettings();

        if (settings.theme) {
          setTheme(settings.theme);
        }

        if (settings.accent_color) {
          setAccentColor(settings.accent_color);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    }

    loadSettings();
  }, []);

  const handleSettingsUpdated = useCallback((updatedSettings) => {
    if (updatedSettings.theme) {
      setTheme(updatedSettings.theme);
    }

    if (updatedSettings.accent_color) {
      setAccentColor(updatedSettings.accent_color);
    }
  }, []);

  function toggleTheme() {
    setTheme((currentTheme) =>
      currentTheme === "dark" ? "light" : "dark"
    );
  }

  return (
    <BrowserRouter>
      <div
        className="app-layout"
        data-theme={theme}
        data-accent={accentColor}
        style={{
          "--accent-color":
            accentValues[accentColor] || accentValues.purple,
        }}
      >
        <Sidebar />

        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  theme={theme}
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
                  onSettingsUpdated={handleSettingsUpdated}
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