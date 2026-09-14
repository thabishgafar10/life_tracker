import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { requestOTP } from "../services/api.js";


function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");


  async function handleRequestOTP(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    const trimmedEmail =
      email.trim();

    if (!trimmedEmail) {
      setError(
        "Please enter your email address."
      );
      return;
    }

    setLoading(true);

    try {
      await requestOTP({
        email: trimmedEmail,
        purpose: "password_reset",
      });

      /*
        Store the email temporarily so the
        OTP verification page knows which
        account the OTP belongs to.
      */
      sessionStorage.setItem(
        "password_reset_email",
        trimmedEmail
      );

      setMessage(
        "OTP sent successfully. Redirecting to verification..."
      );

      /*
        Give the user a moment to see the
        success message before moving on.
      */
      setTimeout(() => {
        navigate("/verify-otp?purpose=password_reset");
      }, 800);

    } catch (error) {
      console.error(
        "Password reset OTP request failed:",
        error
      );

      const detail =
        error.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Unable to send password reset OTP."
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
              BUILD BETTER DAYS.
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
            Forgot your password?
          </h2>

          <p>
            Enter your registered email and
            we'll send you a verification code.
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

        {message && (
          <div className="auth-message">
            {message}
          </div>
        )}


        {/* =========================
            FORM
        ========================= */}

        <form
          className="auth-form"
          onSubmit={handleRequestOTP}
        >

          <div className="auth-form-group">

            <label htmlFor="forgot-email">
              Email
            </label>

            <input
              id="forgot-email"
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


          <button
            className="auth-submit-button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Sending OTP..."
              : "Send verification code"}
          </button>

        </form>


        {/* =========================
            FOOTER
        ========================= */}

        <div className="auth-footer">

          <span>
            Remember your password?
          </span>

          <Link to="/login">
            Back to login
          </Link>

        </div>

      </div>

    </div>
  );
}


export default ForgotPassword;