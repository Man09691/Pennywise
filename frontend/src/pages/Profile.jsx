import { useState } from "react";
import { apiRequest } from "../services/api.js";

function Profile() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleChangePassword(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest("/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      setMessage(data.message);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="profile-page">

      <div className="profile-header">
        <h1>Profile</h1>
        <p>Manage your account and security.</p>
      </div>

      <div className="profile-card">

        <h2>Change Password</h2>

        <p className="profile-description">
          Update your password to keep your account secure.
        </p>

        {message && (
          <p className="form-success">
            {message}
          </p>
        )}

        {error && (
          <p className="form-error">
            {error}
          </p>
        )}

        <form onSubmit={handleChangePassword}>

          <div className="form-group">
            <label>Current Password</label>

            <input
              type="password"
              value={currentPassword}
              onChange={(event) =>
                setCurrentPassword(event.target.value)
              }
              placeholder="Enter current password"
              required
            />
          </div>

          <div className="form-group">
            <label>New Password</label>

            <input
              type="password"
              value={newPassword}
              onChange={(event) =>
                setNewPassword(event.target.value)
              }
              placeholder="Enter new password"
              required
            />
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              placeholder="Confirm new password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
          >
            {loading ? "Changing Password..." : "Change Password"}
          </button>

        </form>

      </div>

    </div>
  );
}

export default Profile;