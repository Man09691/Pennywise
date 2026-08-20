import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Eye,
  EyeOff,
  LockKeyhole,
  Moon,
  Sun,
  Monitor,
  ShieldCheck,
  Tags,
  LogOut,
  Info,
  CheckCircle2,
} from "lucide-react";

import { apiRequest } from "../services/api.js";
import { useTheme } from "../context/ThemeContext.jsx";

// ==================================================
// PASSWORD INPUT
// IMPORTANT:
// Keep this component OUTSIDE Profile()
// so React does not remount it on every keystroke.
// ==================================================

function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
  visible,
  setVisible,
  disabled = false,
}) {
  return (
    <div className="profile-form-group">
      <label htmlFor={label}>
        {label}
      </label>

      <div className="profile-password-input">
        <input
          id={label}
          name={label}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          disabled={disabled}
          autoComplete="off"
        />

        <button
          type="button"
          className="profile-password-toggle"
          onMouseDown={(event) => {
            // Prevent the button from stealing focus
            // from the password input.
            event.preventDefault();
          }}
          onClick={() => {
            setVisible((previous) => !previous);
          }}
          disabled={disabled}
          title={
            visible
              ? "Hide password"
              : "Show password"
          }
          aria-label={
            visible
              ? `Hide ${label}`
              : `Show ${label}`
          }
          tabIndex={-1}
        >
          {visible ? (
            <EyeOff size={18} />
          ) : (
            <Eye size={18} />
          )}
        </button>
      </div>
    </div>
  );
}

// ==================================================
// PROFILE
// ==================================================

function Profile() {
  const navigate = useNavigate();

  const { theme, setTheme } = useTheme();

  // ==================================================
  // PASSWORD STATE
  // ==================================================

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  // ==================================================
  // PASSWORD VISIBILITY
  // ==================================================

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  // ==================================================
  // REQUEST STATE
  // ==================================================

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  // ==================================================
  // CHANGE PASSWORD
  // ==================================================

  async function handleChangePassword(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    // --------------------------------------------------
    // VALIDATION
    // --------------------------------------------------

    if (!currentPassword) {
      setError("Current password is required.");
      return;
    }

    if (!newPassword) {
      setError("New password is required.");
      return;
    }

    if (!confirmPassword) {
      setError("Please confirm your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        "New password and confirm password do not match.",
      );
      return;
    }

    if (newPassword.length < 6) {
      setError(
        "New password must be at least 6 characters.",
      );
      return;
    }

    if (currentPassword === newPassword) {
      setError(
        "New password must be different from your current password.",
      );
      return;
    }

    // --------------------------------------------------
    // START REQUEST
    // --------------------------------------------------

    setLoading(true);

    try {
      const data = await apiRequest(
        "/auth/change-password",
        {
          method: "PUT",

          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword,
          }),
        },
      );

      // ------------------------------------------------
      // SUCCESS
      // ------------------------------------------------

      setMessage(
        data.message ||
          "Password changed successfully.",
      );

      setError("");

      // Clear fields after successful password change.
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Reset visibility.
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (err) {
      setError(
        err.message ||
          "Unable to change password.",
      );
    } finally {
      setLoading(false);
    }
  }

  // ==================================================
  // LOGOUT
  // ==================================================

  function handleLogout() {
    localStorage.removeItem("token");

    navigate("/login", {
      replace: true,
    });
  }

  // ==================================================
  // UI
  // ==================================================

  return (
    <div className="profile-page">

      {/* ==================================================
          HEADER
          ================================================== */}

      <header className="profile-header">

        <span className="profile-label">
          ACCOUNT
        </span>

        <h1>Profile</h1>

        <p>
          Manage your account, security and
          application preferences.
        </p>

      </header>

      {/* ==================================================
          PROFILE INTRO
          ================================================== */}

      <section className="profile-account-card">

        <div className="profile-avatar">
          PW
        </div>

        <div className="profile-account-info">

          <span className="profile-account-label">
            PENNYWISE ACCOUNT
          </span>

          <h2>Your Account</h2>

          <p>
            Manage your Pennywise preferences and
            security settings from one place.
          </p>

        </div>

      </section>

      {/* ==================================================
          MAIN SECTIONS
          ================================================== */}

      <div className="profile-sections">

        {/* ==================================================
            SECURITY
            ================================================== */}

        <section className="profile-section profile-security">

          <div className="profile-section-header">

            <div className="profile-section-icon">
              <LockKeyhole size={20} />
            </div>

            <div>

              <span className="profile-section-label">
                SECURITY
              </span>

              <h2>Change Password</h2>

              <p>
                Update your password to keep your
                account secure.
              </p>

            </div>

          </div>

          {/* ==================================================
              SUCCESS MESSAGE
              ================================================== */}

          {message && (
            <div className="profile-message profile-success">

              <CheckCircle2 size={17} />

              <span>
                {message}
              </span>

            </div>
          )}

          {/* ==================================================
              ERROR MESSAGE
              ================================================== */}

          {error && (
            <div className="profile-message profile-error">

              <ShieldCheck size={17} />

              <span>
                {error}
              </span>

            </div>
          )}

          {/* ==================================================
              PASSWORD FORM
              ================================================== */}

          <form
            onSubmit={handleChangePassword}
            className="profile-password-form"
          >

            {/* CURRENT PASSWORD */}

            <PasswordInput
              label="Current Password"
              value={currentPassword}
              onChange={(event) => {
                setCurrentPassword(
                  event.target.value,
                );
              }}
              placeholder="Enter current password"
              visible={showCurrentPassword}
              setVisible={
                setShowCurrentPassword
              }
              disabled={loading}
            />

            {/* NEW PASSWORD */}

            <PasswordInput
              label="New Password"
              value={newPassword}
              onChange={(event) => {
                setNewPassword(
                  event.target.value,
                );
              }}
              placeholder="Enter new password"
              visible={showNewPassword}
              setVisible={
                setShowNewPassword
              }
              disabled={loading}
            />

            {/* CONFIRM PASSWORD */}

            <PasswordInput
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(
                  event.target.value,
                );
              }}
              placeholder="Confirm new password"
              visible={showConfirmPassword}
              setVisible={
                setShowConfirmPassword
              }
              disabled={loading}
            />

            {/* SUBMIT */}

            <button
              type="submit"
              className="profile-primary-button"
              disabled={loading}
            >

              <LockKeyhole size={17} />

              {loading
                ? "Changing Password..."
                : "Change Password"}

            </button>

          </form>

        </section>

        {/* ==================================================
            APPEARANCE
            ================================================== */}

        <section className="profile-section">

          <div className="profile-section-header">

            <div className="profile-section-icon">
              <Moon size={20} />
            </div>

            <div>

              <span className="profile-section-label">
                APPEARANCE
              </span>

              <h2>Theme</h2>

              <p>
                Choose how Pennywise should look.
              </p>

            </div>

          </div>

          <div className="theme-options">

            {/* LIGHT */}

            <button
              type="button"
              className={`theme-option ${
                theme === "light"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setTheme("light")
              }
            >

              <div className="theme-option-icon">
                <Sun size={20} />
              </div>

              <div>

                <strong>
                  Light
                </strong>

                <span>
                  Use the light theme.
                </span>

              </div>

              {theme === "light" && (
                <CheckCircle2
                  className="theme-check"
                  size={19}
                />
              )}

            </button>

            {/* DARK */}

            <button
              type="button"
              className={`theme-option ${
                theme === "dark"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setTheme("dark")
              }
            >

              <div className="theme-option-icon">
                <Moon size={20} />
              </div>

              <div>

                <strong>
                  Dark
                </strong>

                <span>
                  Easier on the eyes at night.
                </span>

              </div>

              {theme === "dark" && (
                <CheckCircle2
                  className="theme-check"
                  size={19}
                />
              )}

            </button>

            {/* SYSTEM */}

            <button
              type="button"
              className={`theme-option ${
                theme === "system"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setTheme("system")
              }
            >

              <div className="theme-option-icon">
                <Monitor size={20} />
              </div>

              <div>

                <strong>
                  System
                </strong>

                <span>
                  Follow your device theme.
                </span>

              </div>

              {theme === "system" && (
                <CheckCircle2
                  className="theme-check"
                  size={19}
                />
              )}

            </button>

          </div>

        </section>

        {/* ==================================================
            DATA & PREFERENCES
            ================================================== */}

        <section className="profile-section">

          <div className="profile-section-header">

            <div className="profile-section-icon">
              <Tags size={20} />
            </div>

            <div>

              <span className="profile-section-label">
                DATA & PREFERENCES
              </span>

              <h2>
                Manage Categories
              </h2>

              <p>
                Create and manage your expense
                and income categories.
              </p>

            </div>

          </div>

          <button
            type="button"
            className="profile-secondary-button"
            onClick={() =>
              navigate("/categories")
            }
          >

            <Tags size={17} />

            Manage Categories

          </button>

        </section>

        {/* ==================================================
            ABOUT
            ================================================== */}

        <section className="profile-section">

          <div className="profile-section-header">

            <div className="profile-section-icon">
              <Info size={20} />
            </div>

            <div>

              <span className="profile-section-label">
                ABOUT
              </span>

              <h2>
                About Pennywise
              </h2>

              <p>
                Your personal expense tracking
                application.
              </p>

            </div>

          </div>

          <div className="profile-about">

            <div>
              <span>
                Application
              </span>

              <strong>
                Pennywise
              </strong>
            </div>

            <div>
              <span>
                Version
              </span>

              <strong>
                1.0.0
              </strong>
            </div>

            <div>
              <span>
                Technology
              </span>

              <strong>
                MERN Stack
              </strong>
            </div>

          </div>

        </section>

        {/* ==================================================
            LOGOUT
            ================================================== */}

        <section className="profile-logout-section">

          <div>

            <span className="profile-section-label">
              ACCOUNT
            </span>

            <h2>
              Sign out of Pennywise
            </h2>

            <p>
              You can log back in anytime using
              your account credentials.
            </p>

          </div>

          <button
            type="button"
            className="profile-logout-button"
            onClick={handleLogout}
          >

            <LogOut size={17} />

            Log Out

          </button>

        </section>

      </div>

    </div>
  );
}

export default Profile; 