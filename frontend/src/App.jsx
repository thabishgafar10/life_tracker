import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";

import Dashboard from "./pages/Dashboard";
import Habits from "./pages/Habits";
import Analytics from "./pages/Analytics";
import Notes from "./pages/Notes";
import Settings from "./pages/Settings";

import "./App.css";

function App() {
  const [theme, setTheme] = useState("dark");

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
              element={<Settings />}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;