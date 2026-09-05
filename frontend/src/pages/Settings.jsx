import { useEffect, useState } from "react";
import {
  Camera,
  Save,
  Check,
  User,
  Mail,
  Globe,
  Palette,
  Bell,
  CalendarDays,
} from "lucide-react";

import {
  getSettings,
  updateSettings,
} from "../services/settingsApi";

import "./Settings.css";

const accentColors = [
  {
    name: "purple",
    label: "Purple",
    value: "#8b5cf6",
  },
  {
    name: "blue",
    label: "Blue",
    value: "#3b82f6",
  },
  {
    name: "green",
    label: "Green",
    value: "#22c55e",
  },
  {
    name: "yellow",
    label: "Yellow",
    value: "#eab308",
  },
  {
    name: "pink",
    label: "Pink",
    value: "#ec4899",
  },
];

function Settings({ onSettingsUpdated }) {
  const [activeTab, setActiveTab] = useState("profile");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    timezone: "Asia/Kolkata",
    theme: "dark",
    accent_color: "purple",
    daily_reminders: true,
    reminder_time: "08:00",
    week_start_day: "Monday",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        setError("");

        const settings = await getSettings();

        const loadedSettings = {
          name: settings.name ?? "",
          email: settings.email ?? "",
          timezone: settings.timezone ?? "Asia/Kolkata",
          theme: settings.theme ?? "dark",
          accent_color: settings.accent_color ?? "purple",
          daily_reminders:
            settings.daily_reminders ?? true,
          reminder_time:
            settings.reminder_time ?? "08:00",
          week_start_day:
            settings.week_start_day ?? "Monday",
        };

        setFormData(loadedSettings);

        // Apply backend settings to the whole app
        onSettingsUpdated(loadedSettings);
      } catch (err) {
        console.error(
          "Failed to load settings:",
          err
        );

        setError(
          "Failed to load settings from the server."
        );
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [onSettingsUpdated]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    const newValue =
      type === "checkbox" ? checked : value;

    const updatedSettings = {
      ...formData,
      [name]: newValue,
    };

    setFormData(updatedSettings);

    // Apply theme immediately
    if (name === "theme") {
      onSettingsUpdated(updatedSettings);
    }

    setSaved(false);
  }

  function handleAccentChange(color) {
    const updatedSettings = {
      ...formData,
      accent_color: color,
    };

    setFormData(updatedSettings);

    // Apply accent immediately
    onSettingsUpdated(updatedSettings);

    setSaved(false);
  }

  async function handleSave() {
    try {
      setSaving(true);
      setSaved(false);
      setError("");

      const updatedSettings =
        await updateSettings(formData);

      const savedSettings = {
        name: updatedSettings.name ?? "",
        email: updatedSettings.email ?? "",
        timezone:
          updatedSettings.timezone ??
          "Asia/Kolkata",
        theme:
          updatedSettings.theme ?? "dark",
        accent_color:
          updatedSettings.accent_color ??
          "purple",
        daily_reminders:
          updatedSettings.daily_reminders ??
          true,
        reminder_time:
          updatedSettings.reminder_time ??
          "08:00",
        week_start_day:
          updatedSettings.week_start_day ??
          "Monday",
      };

      setFormData(savedSettings);

      // Keep the whole application synchronized
      onSettingsUpdated(savedSettings);

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (err) {
      console.error(
        "Failed to save settings:",
        err
      );

      setError(
        "Failed to save settings. Make sure the backend is running."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-loading">
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">

      {/* HEADER */}
      <div className="settings-header">
        <div>
          <h1>Settings</h1>

          <p>
            Manage your preferences and account.
          </p>
        </div>

        <button
          className="settings-save-button"
          onClick={handleSave}
          disabled={saving}
        >
          {saved ? (
            <>
              <Check size={17} />
              Saved
            </>
          ) : (
            <>
              <Save size={17} />
              {saving
                ? "Saving..."
                : "Save Changes"}
            </>
          )}
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="settings-error">
          {error}
        </div>
      )}

      {/* TABS */}
      <div className="settings-tabs">

        <button
          type="button"
          className={
            activeTab === "profile"
              ? "settings-tab active"
              : "settings-tab"
          }
          onClick={() => setActiveTab("profile")}
        >
          Profile
        </button>

        <button
          type="button"
          className={
            activeTab === "preferences"
              ? "settings-tab active"
              : "settings-tab"
          }
          onClick={() =>
            setActiveTab("preferences")
          }
        >
          Preferences
        </button>

        <button
          type="button"
          className={
            activeTab === "notifications"
              ? "settings-tab active"
              : "settings-tab"
          }
          onClick={() =>
            setActiveTab("notifications")
          }
        >
          Notifications
        </button>

        <button
          type="button"
          className={
            activeTab === "privacy"
              ? "settings-tab active"
              : "settings-tab"
          }
          onClick={() =>
            setActiveTab("privacy")
          }
        >
          Data & Privacy
        </button>

      </div>

      {/* PROFILE */}
      {activeTab === "profile" && (
        <div className="settings-grid">

          {/* PROFILE INFORMATION */}
          <section className="settings-card">

            <div className="settings-card-heading">
              <div>
                <h2>
                  Profile Information
                </h2>

                <p>
                  Update your personal account
                  information.
                </p>
              </div>

              <User size={20} />
            </div>

            <div className="profile-photo-section">

              <div className="profile-avatar">
                {formData.name
                  ? formData.name
                      .charAt(0)
                      .toUpperCase()
                  : "U"}
              </div>

              <button
                className="change-photo-button"
                type="button"
              >
                <Camera size={16} />
                Change Photo
              </button>

            </div>

            <div className="settings-form-grid">

              <div className="settings-field">
                <label htmlFor="name">
                  <User size={15} />
                  Name
                </label>

                <input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                />
              </div>

              <div className="settings-field">
                <label htmlFor="email">
                  <Mail size={15} />
                  Email
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                />
              </div>

              <div className="settings-field full-width">
                <label htmlFor="timezone">
                  <Globe size={15} />
                  Timezone
                </label>

                <select
                  id="timezone"
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                >
                  <option value="Asia/Kolkata">
                    (GMT+05:30) Asia/Kolkata
                  </option>

                  <option value="Asia/Dubai">
                    (GMT+04:00) Asia/Dubai
                  </option>

                  <option value="Asia/Singapore">
                    (GMT+08:00) Asia/Singapore
                  </option>

                  <option value="Europe/London">
                    (GMT+00:00) Europe/London
                  </option>

                  <option value="America/New_York">
                    (GMT-05:00) America/New_York
                  </option>

                  <option value="America/Los_Angeles">
                    (GMT-08:00) America/Los_Angeles
                  </option>
                </select>
              </div>

            </div>
          </section>

          {/* APPEARANCE */}
          <section className="settings-card">

            <div className="settings-card-heading">

              <div>
                <h2>
                  Appearance
                </h2>

                <p>
                  Customize how Life Tracker looks.
                </p>
              </div>

              <Palette size={20} />

            </div>

            <div className="settings-field">

              <label htmlFor="theme">
                Theme
              </label>

              <select
                id="theme"
                name="theme"
                value={formData.theme}
                onChange={handleChange}
              >
                <option value="dark">
                  Dark
                </option>

                <option value="light">
                  Light
                </option>
              </select>

            </div>

            <div className="accent-section">

              <label>
                Accent Color
              </label>

              <div className="accent-options">

                {accentColors.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    title={color.label}
                    aria-label={`Use ${color.label} accent`}
                    className={
                      formData.accent_color ===
                      color.name
                        ? "accent-color selected"
                        : "accent-color"
                    }
                    style={{
                      "--accent-value":
                        color.value,
                    }}
                    onClick={() =>
                      handleAccentChange(
                        color.name
                      )
                    }
                  >
                    {formData.accent_color ===
                      color.name && (
                      <Check size={14} />
                    )}
                  </button>
                ))}

              </div>

            </div>

            <div className="settings-divider" />

            <div className="settings-field">

              <label htmlFor="week_start_day">
                <CalendarDays size={15} />
                Week Start Day
              </label>

              <select
                id="week_start_day"
                name="week_start_day"
                value={formData.week_start_day}
                onChange={handleChange}
              >
                <option value="Monday">
                  Monday
                </option>

                <option value="Sunday">
                  Sunday
                </option>

                <option value="Saturday">
                  Saturday
                </option>
              </select>

            </div>

          </section>

        </div>
      )}

      {/* PREFERENCES */}
      {activeTab === "preferences" && (
        <section className="settings-card single-card">

          <div className="settings-card-heading">

            <div>
              <h2>
                Preferences
              </h2>

              <p>
                Control your general Life Tracker
                preferences.
              </p>
            </div>

            <Palette size={20} />

          </div>

          <div className="preference-row">

            <div>
              <strong>
                Theme
              </strong>

              <span>
                Choose between dark and light mode.
              </span>
            </div>

            <select
              name="theme"
              value={formData.theme}
              onChange={handleChange}
            >
              <option value="dark">
                Dark
              </option>

              <option value="light">
                Light
              </option>
            </select>

          </div>

          <div className="preference-row">

            <div>
              <strong>
                Week Start Day
              </strong>

              <span>
                Choose which day your week begins.
              </span>
            </div>

            <select
              name="week_start_day"
              value={formData.week_start_day}
              onChange={handleChange}
            >
              <option value="Monday">
                Monday
              </option>

              <option value="Sunday">
                Sunday
              </option>

              <option value="Saturday">
                Saturday
              </option>
            </select>

          </div>

        </section>
      )}

      {/* NOTIFICATIONS */}
      {activeTab === "notifications" && (
        <section className="settings-card single-card">

          <div className="settings-card-heading">

            <div>
              <h2>
                Notifications
              </h2>

              <p>
                Configure your daily reminder
                preferences.
              </p>
            </div>

            <Bell size={20} />

          </div>

          <div className="notification-setting">

            <div>

              <strong>
                Daily Reminders
              </strong>

              <span>
                Enable or disable your daily habit
                reminders.
              </span>

            </div>

            <label className="switch">

              <input
                type="checkbox"
                name="daily_reminders"
                checked={
                  formData.daily_reminders
                }
                onChange={handleChange}
              />

              <span className="switch-slider" />

            </label>

          </div>

          <div className="settings-field reminder-time-field">

            <label htmlFor="reminder_time">
              Reminder Time
            </label>

            <input
              id="reminder_time"
              name="reminder_time"
              type="time"
              value={formData.reminder_time}
              onChange={handleChange}
              disabled={
                !formData.daily_reminders
              }
            />

          </div>

          <div className="notification-note">
            Reminder delivery will be implemented
            after the frontend is completed.
          </div>

        </section>
      )}

      {/* PRIVACY */}
      {activeTab === "privacy" && (
        <section className="settings-card single-card">

          <div className="settings-card-heading">

            <div>
              <h2>
                Data & Privacy
              </h2>

              <p>
                Manage your Life Tracker data.
              </p>
            </div>

          </div>

          <div className="privacy-info">

            <h3>
              Your data
            </h3>

            <p>
              Your activities, activity logs,
              daily notes, and settings are stored
              by the Life Tracker backend.
            </p>

            <p>
              More data export and deletion controls
              can be added here later.
            </p>

          </div>

        </section>
      )}

    </div>
  );
}

export default Settings;