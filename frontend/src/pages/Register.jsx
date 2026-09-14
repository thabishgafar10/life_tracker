import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

import { registerUser } from "../services/api.js";

function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
    Password validation.
  */
  function validatePassword(value) {
    if (value.length < 8 || value.length > 20) {
      return "Password must be between 8 and 20 characters.";
    }

    if (/\s/.test(value)) {
      return "Password cannot contain spaces.";
    }

    if (!/[A-Za-z]/.test(value)) {
      return "Password must contain at least one alphabetic character.";
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

  async function handleRegister(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    if (!trimmedUsername) {
      setError("Please enter a username.");
      return;
    }

    if (!trimmedEmail) {
      setError("Please enter your email.");
      return;
    }

    const passwordError =
      validatePassword(password);

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
      await registerUser({
        username: trimmedUsername,
        email: trimmedEmail,
        password,
      });

      setSuccess(
        "Registration successful. Redirecting to login..."
      );

      /*
        Registration does NOT automatically log
        the user in.
      */
      setTimeout(() => {
        navigate("/login", {
          replace: true,
        });
      }, 1200);
    } catch (error) {
      console.error(
        "Registration failed:",
        error
      );

      const detail =
        error.response?.data?.detail;

      if (typeof detail === "string") {
        setError(detail);
      } else {
        setError(
          "Registration failed. Please try again."
        );
      }
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
              BUILD BETTER DAYS.
            </p>
          </div>

        </div>


        {/* =========================
            HEADER
        ========================= */}

        <div className="auth-header">

          <p className="auth-eyebrow">
            GET STARTED
          </p>

          <h2>
            Create your account
          </h2>

          <p>
            Start tracking your habits,
            progress and daily life.
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
            SUCCESS
        ========================= */}

        {success && (
          <div className="auth-message">
            {success}
          </div>
        )}


        {/* =========================
            REGISTER FORM
        ========================= */}

        <form
          className="auth-form"
          onSubmit={handleRegister}
        >

          {/* USERNAME */}

          <div className="auth-form-group">

            <label htmlFor="register-username">
              Username
            </label>

            <input
              id="register-username"
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(
                  event.target.value
                )
              }
              placeholder="Choose a username"
              autoComplete="username"
              maxLength={50}
              required
            />

          </div>


          {/* EMAIL */}

          <div className="auth-form-group">

            <label htmlFor="register-email">
              Email
            </label>

            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="Enter your email"
              autoComplete="email"
              required
            />

          </div>


          {/* PASSWORD */}

          <div className="auth-form-group">

            <label htmlFor="register-password">
              Password
            </label>

            <div className="password-input-wrapper">

              <input
                id="register-password"
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
                placeholder="Create a password"
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

            <div className="password-hint">
              8–20 characters • uppercase • number
              • symbol • no spaces
            </div>

          </div>


          {/* CONFIRM PASSWORD */}

          <div className="auth-form-group">

            <label htmlFor="register-confirm-password">
              Confirm password
            </label>

            <div className="password-input-wrapper">

              <input
                id="register-confirm-password"
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
                placeholder="Confirm your password"
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
              ? "Creating account..."
              : "Create account"}
          </button>

        </form>


        {/* =========================
            LOGIN LINK
        ========================= */}

        <div className="auth-footer">

          <span>
            Already have an account?
          </span>

          <Link to="/login">
            Sign in
          </Link>

        </div>

      </div>

    </div>
  );
}

export default Register;