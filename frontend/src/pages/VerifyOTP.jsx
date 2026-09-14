import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  requestOTP,
  verifyOTP,
} from "../services/api.js";


function VerifyOTP() {
  const navigate = useNavigate();

  const [searchParams] =
    useSearchParams();

  const purpose =
    searchParams.get("purpose") ||
    "login";


  const [email, setEmail] =
    useState("");

  const [otp, setOtp] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [resending, setResending] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");


  /*
    Load the email depending on the
    authentication flow.
  */
  useEffect(() => {
    if (purpose === "password_reset") {
      const resetEmail =
        sessionStorage.getItem(
          "password_reset_email"
        );

      if (resetEmail) {
        setEmail(resetEmail);
      }
    } else {
      const loginEmail =
        sessionStorage.getItem(
          "otp_login_email"
        );

      if (loginEmail) {
        setEmail(loginEmail);
      }
    }
  }, [purpose]);


  /*
    Verify OTP.
  */
  async function handleVerifyOTP(event) {
    event.preventDefault();

    setError("");
    setMessage("");


    const trimmedEmail =
      email.trim();

    const trimmedOTP =
      otp.trim();


    if (!trimmedEmail) {
      setError(
        "Email address is required."
      );
      return;
    }


    if (trimmedOTP.length !== 6) {
      setError(
        "Please enter the 6-digit OTP."
      );
      return;
    }


    setLoading(true);


    try {
      const response =
        await verifyOTP({
          email: trimmedEmail,
          otp: trimmedOTP,
          purpose,
        });


      /*
        ================================
        PASSWORD RESET
        ================================
      */

      if (purpose === "password_reset") {

        if (!response.reset_token) {
          throw new Error(
            "Reset token was not returned."
          );
        }


        /*
          Store the reset token temporarily.

          IMPORTANT:
          This is NOT stored as the normal
          access_token.
        */
        sessionStorage.setItem(
          "password_reset_token",
          response.reset_token
        );


        navigate(
          "/reset-password",
          { replace: true }
        );

        return;
      }


      /*
        ================================
        OTP LOGIN
        ================================
      */

      if (!response.access_token) {
        throw new Error(
          "Access token was not returned."
        );
      }


      /*
        OTP login returns an access token.
      */
      localStorage.setItem(
        "access_token",
        response.access_token
      );


      /*
        Remove temporary login email.
      */
      sessionStorage.removeItem(
        "otp_login_email"
      );


      /*
        Enter application.
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
    Resend OTP.
  */
  async function handleResendOTP() {
    setError("");
    setMessage("");
    setResending(true);


    try {
      await requestOTP({
        email: email.trim(),
        purpose,
      });


      setOtp("");


      setMessage(
        "A new OTP has been sent to your email."
      );

    } catch (error) {
      console.error(
        "OTP resend failed:",
        error
      );


      const detail =
        error.response?.data?.detail;


      setError(
        typeof detail === "string"
          ? detail
          : "Unable to resend OTP."
      );

    } finally {
      setResending(false);
    }
  }


  /*
    Change OTP input to digits only.
  */
  function handleOTPChange(event) {
    const value =
      event.target.value
        .replace(/\D/g, "")
        .slice(0, 6);

    setOtp(value);
  }


  const isPasswordReset =
    purpose === "password_reset";


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
            {isPasswordReset
              ? "PASSWORD RESET"
              : "EMAIL VERIFICATION"}
          </p>

          <h2>
            {isPasswordReset
              ? "Verify your email"
              : "Enter verification code"}
          </h2>

          <p>
            We sent a 6-digit verification
            code to your email. The code
            expires in 10 minutes.
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
          onSubmit={handleVerifyOTP}
        >

          {/* EMAIL */}

          <div className="auth-form-group">

            <label htmlFor="verify-email">
              Email
            </label>

            <input
              id="verify-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="Your registered email"
              autoComplete="email"
              required
            />

          </div>


          {/* OTP */}

          <div className="auth-form-group">

            <label htmlFor="verify-otp">
              Verification code
            </label>

            <input
              id="verify-otp"
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={handleOTPChange}
              placeholder="Enter 6-digit OTP"
              autoComplete="one-time-code"
              maxLength={6}
              required
            />

          </div>


          {/* VERIFY */}

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


          {/* RESEND */}

          <button
            type="button"
            className="auth-secondary-button"
            onClick={handleResendOTP}
            disabled={
              resending ||
              loading
            }
          >
            {resending
              ? "Sending..."
              : "Resend OTP"}
          </button>

        </form>


        {/* =========================
            FOOTER
        ========================= */}

        <div className="auth-footer">

          <Link
            to={
              isPasswordReset
                ? "/forgot-password"
                : "/login"
            }
          >
            {isPasswordReset
              ? "Change email"
              : "Back to login"}
          </Link>

        </div>

      </div>

    </div>
  );
}


export default VerifyOTP;