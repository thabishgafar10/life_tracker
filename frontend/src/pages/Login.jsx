import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

import { useAuth } from "../context/AuthContext.jsx";
import {
  requestOTP,
  saveAccessToken,
  verifyOTP,
} from "../services/api.js";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loginMethod, setLoginMethod] =
    useState("password");

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [email, setEmail] =
    useState("");

  const [otp, setOtp] =
    useState("");

  const [otpSent, setOtpSent] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  /*
    Normal username/password login.
  */
  async function handlePasswordLogin(event) {
    event.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      await login({
        username: username.trim(),
        password,
      });

      navigate("/", { replace: true });
    } catch (error) {
      console.error("Login failed:", error);

      const detail =
        error.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Invalid username or password."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
    Request email OTP for LOGIN.

    Important:
    purpose must remain "login".
    This prevents a password-reset OTP from
    being used as a login OTP.
  */
  async function handleRequestOTP(event) {
    event.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    const trimmedEmail = email.trim();

    try {
      await requestOTP({
        email: trimmedEmail,
        purpose: "login",
      });

      sessionStorage.setItem(
        "otp_login_email",
        trimmedEmail
      );

      setOtpSent(true);

      setMessage(
        "OTP sent to your email. It expires in 10 minutes."
      );
    } catch (error) {
      console.error(
        "OTP request failed:",
        error
      );

      const detail =
        error.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Unable to send OTP."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
    Verify email OTP for LOGIN.
  */
  async function handleVerifyOTP(event) {
    event.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    const trimmedEmail = email.trim();
    const trimmedOTP = otp.trim();

    try {
      const response =
        await verifyOTP({
          email: trimmedEmail,
          otp: trimmedOTP,
          purpose: "login",
        });

      /*
        Login OTP must return an access token.
      */
      if (!response.access_token) {
        throw new Error(
          "Access token was not returned."
        );
      }

      saveAccessToken(
        response.access_token
      );

      sessionStorage.removeItem(
        "otp_login_email"
      );

      /*
        Reload the application so AuthContext
        restores the newly created session.
      */
      window.location.href = "/";
    } catch (error) {
      console.error(
        "OTP verification failed:",
        error
      );

      const detail =
        error.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Invalid or expired OTP."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
    Switch between password login and OTP login.
  */
  function switchLoginMethod(method) {
    setLoginMethod(method);

    setError("");
    setMessage("");

    setOtpSent(false);
    setOtp("");
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
            WELCOME BACK
          </p>

          <h2>
            Sign in to your account
          </h2>

          <p>
            Continue tracking your habits,
            progress and daily notes.
          </p>
        </div>


        {/* =========================
            LOGIN METHOD
        ========================= */}

        <div className="auth-method-tabs">

          <button
            type="button"
            className={
              loginMethod === "password"
                ? "auth-method active"
                : "auth-method"
            }
            onClick={() =>
              switchLoginMethod("password")
            }
          >
            Password
          </button>

          <button
            type="button"
            className={
              loginMethod === "otp"
                ? "auth-method active"
                : "auth-method"
            }
            onClick={() =>
              switchLoginMethod("otp")
            }
          >
            Email OTP
          </button>

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
            MESSAGE
        ========================= */}

        {message && (
          <div className="auth-message">
            {message}
          </div>
        )}


        {/* =========================
            PASSWORD LOGIN
        ========================= */}

        {loginMethod === "password" && (
          <form
            className="auth-form"
            onSubmit={handlePasswordLogin}
          >

            <div className="auth-form-group">

              <label htmlFor="username">
                Username
              </label>

              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(
                    event.target.value
                  )
                }
                placeholder="Enter your username"
                autoComplete="username"
                required
              />

            </div>


            <div className="auth-form-group">

              <label htmlFor="password">
                Password
              </label>

              <div className="password-input-wrapper">

                <input
                  id="password"
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
                  placeholder="Enter your password"
                  autoComplete="current-password"
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


            <div className="auth-forgot-row">

              <Link to="/forgot-password">
                Forgot password?
              </Link>

            </div>


            <button
              className="auth-submit-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Signing in..."
                : "Sign in"}
            </button>

          </form>
        )}


        {/* =========================
            OTP LOGIN
        ========================= */}

        {loginMethod === "otp" && (
          <form
            className="auth-form"
            onSubmit={
              otpSent
                ? handleVerifyOTP
                : handleRequestOTP
            }
          >

            <div className="auth-form-group">

              <label htmlFor="otp-email">
                Email
              </label>

              <input
                id="otp-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="Enter your registered email"
                autoComplete="email"
                required
              />

            </div>


            {!otpSent ? (

              <button
                className="auth-submit-button"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Sending OTP..."
                  : "Send OTP"}
              </button>

            ) : (

              <>
                <div className="auth-form-group">

                  <label htmlFor="otp">
                    Verification code
                  </label>

                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(event) => {
                      const value =
                        event.target.value
                          .replace(/\D/g, "")
                          .slice(0, 6);

                      setOtp(value);
                    }}
                    placeholder="Enter 6-digit OTP"
                    autoComplete="one-time-code"
                    required
                  />

                </div>


                <button
                  className="auth-submit-button"
                  type="submit"
                  disabled={
                    loading ||
                    otp.length !== 6
                  }
                >
                  {loading
                    ? "Verifying..."
                    : "Verify OTP"}
                </button>


                <button
                  type="button"
                  className="auth-secondary-button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                    setError("");
                    setMessage("");
                  }}
                  disabled={loading}
                >
                  Use a different email
                </button>

              </>

            )}

          </form>
        )}


        {/* =========================
            REGISTER
        ========================= */}

        <div className="auth-footer">

          <span>
            Don't have an account?
          </span>

          <Link to="/register">
            Create one
          </Link>

        </div>

      </div>
    </div>
  );
}

export default Login;