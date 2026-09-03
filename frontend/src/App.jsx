import { useEffect, useState } from "react";
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

function App() {
  const [theme, setTheme] = useState("dark");
  const [accentColor, setAccentColor] = useState("purple");

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSettings();

        setTheme(settings.theme || "dark");
        setAccentColor(settings.accent_color || "purple");
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    }

    loadSettings();
  }, []);

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((currentTheme) =>
      currentTheme === "dark" ? "light" : "dark"
    );
  }

  function handleSettingsUpdated(updatedSettings) {
    if (updatedSettings.theme) {
      setTheme(updatedSettings.theme);
    }

    if (updatedSettings.accent_color) {
      setAccentColor(updatedSettings.accent_color);
    }
  }

  return (
    <BrowserRouter>
      <div
        className="app-layout"
        data-theme={theme}
        data-accent={accentColor}
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