import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

import { resetPassword } from "../services/api.js";

function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function validatePassword(value) {
    if (value.length < 8 || value.length > 20) {
      return "Password must be between 8 and 20 characters.";
    }

    if (/\s/.test(value)) {
      return "Password must not contain whitespace.";
    }

    if (!/[A-Za-z]/.test(value)) {
      return "Password must contain at least one letter.";
    }

    if (!/[A-Z]/.test(value)) {
      return "Password must contain at least one uppercase letter.";
    }

    if (!/[0-9]/.test(value)) {
      return "Password must contain at least one number.";
    }

    if (!/[^A-Za-z0-9]/.test(value)) {
      return "Password must contain at least one symbol.";
    }

    return "";
  }

  async function handleResetPassword(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    const resetToken = sessionStorage.getItem(
      "password_reset_token"
    );

    if (!resetToken) {
      setError(
        "Your password reset session has expired. Please request a new OTP."
      );
      return;
    }

    const passwordError = validatePassword(password);

    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await resetPassword({
        reset_token: resetToken,
        new_password: password,
      });

      sessionStorage.removeItem(
        "password_reset_token"
      );

      sessionStorage.removeItem(
        "password_reset_email"
      );

      setMessage(
        "Password reset successfully. Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch (error) {
      console.error(
        "Password reset failed:",
        error
      );

      const detail =
        error.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Unable to reset your password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* =========================
            BRAND
        ========================= */}

        <div className="auth-brand">

          <div className="auth-logo">
            ✓
          </div>

          <div>
            <h1>Life Tracker</h1>

            <p>
              Build better days.
            </p>
          </div>

        </div>


        {/* =========================
            HEADER
        ========================= */}

        <div className="auth-header">

          <p className="auth-eyebrow">
            PASSWORD RESET
          </p>

          <h2>
            Create a new password
          </h2>

          <p>
            Your email has been verified.
            Choose a new password for your account.
          </p>

        </div>


        {/* =========================
            ERROR
        ========================= */}

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}


        {/* =========================
            SUCCESS MESSAGE
        ========================= */}

        {message && (
          <div className="auth-message">
            {message}
          </div>
        )}


        {/* =========================
            RESET FORM
        ========================= */}

        <form
          className="auth-form"
          onSubmit={handleResetPassword}
        >

          {/* NEW PASSWORD */}

          <div className="auth-form-group">

            <label htmlFor="new-password">
              New password
            </label>

            <div className="password-input-wrapper">

              <input
                id="new-password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Enter your new password"
                autoComplete="new-password"
                maxLength={20}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(
                    (current) => !current
                  )
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>

            </div>

          </div>


          {/* PASSWORD REQUIREMENTS */}

          <p className="password-hint">
            8–20 characters, at least one letter,
            uppercase letter, number and symbol,
            with no spaces.
          </p>


          {/* CONFIRM PASSWORD */}

          <div className="auth-form-group">

            <label htmlFor="confirm-password">
              Confirm new password
            </label>

            <div className="password-input-wrapper">

              <input
                id="confirm-password"
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                placeholder="Re-enter your new password"
                autoComplete="new-password"
                maxLength={20}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowConfirmPassword(
                    (current) => !current
                  )
                }
                aria-label={
                  showConfirmPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>

            </div>

          </div>


          {/* SUBMIT */}

          <button
            className="auth-submit-button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Resetting password..."
              : "Reset password"}
          </button>

        </form>


        {/* =========================
            FOOTER
        ========================= */}

        <div className="auth-footer">

          <Link to="/login">
            Back to login
          </Link>

        </div>

      </div>
    </div>
  );
}

export default ResetPassword;