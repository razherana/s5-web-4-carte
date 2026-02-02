import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import AppShell from "../components/AppShell";
import "./AuthPages.css";

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    email: user?.email || "",
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    // Validate password confirmation
    if (
      formData.password &&
      formData.password !== formData.password_confirmation
    ) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }

    // Validate current password is provided when changing password
    if (formData.password && !formData.current_password) {
      setMessage({
        type: "error",
        text: "Current password is required to change password.",
      });
      return;
    }

    setLoading(true);

    try {
      // Only send fields that have values
      const updateData = {};
      if (formData.email && formData.email !== user?.email) {
        updateData.email = formData.email;
      }
      if (formData.password) {
        updateData.password = formData.password;
        updateData.current_password = formData.current_password;
      }

      // Only make request if there's something to update
      if (Object.keys(updateData).length === 0) {
        setMessage({ type: "info", text: "No changes to update." });
        setLoading(false);
        return;
      }

      const result = await updateProfile(updateData);
      const syncMessage = result.firebase_synced
        ? "Profile updated and synced with Firebase!"
        : "Profile updated locally. Will sync with Firebase when online.";
      setMessage({ type: "success", text: syncMessage });

      // Clear password fields after successful update
      setFormData((prev) => ({
        ...prev,
        current_password: "",
        password: "",
        password_confirmation: "",
      }));
    } catch (err) {
      // Handle backend error format: { status: 'error', error: { code, message } }
      const errorMessage =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        "Update failed. Please try again.";
      setMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      title="Profile Settings"
      subtitle="Update your account information"
    >
      <div className="profile-grid">
        <div className="auth-card glass-card">
          <div className="auth-header">
            <h2 className="auth-title">Account Details</h2>
            <p className="auth-subtitle">Keep your profile up to date.</p>
          </div>

          {message.text && (
            <div className={`alert alert-${message.type}`}>{message.text}</div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="glass-input"
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Role</label>
              <input
                type="text"
                value={user?.role || "visitor"}
                className="glass-input disabled-input"
                disabled
              />
            </div>

            <hr className="form-divider" />

            <h3 className="form-section-title">Change Password</h3>
            <p className="form-section-subtitle">
              Leave blank to keep current password
            </p>

            <div className="form-group">
              <label htmlFor="current_password" className="form-label">
                Current Password
              </label>
              <input
                type="password"
                id="current_password"
                name="current_password"
                value={formData.current_password}
                onChange={handleChange}
                className="glass-input"
                placeholder="Enter current password"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                New Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="glass-input"
                placeholder="Enter new password (min 6 characters)"
                minLength={6}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password_confirmation" className="form-label">
                Confirm New Password
              </label>
              <input
                type="password"
                id="password_confirmation"
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleChange}
                className="glass-input"
                placeholder="Confirm new password"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn-primary btn-block"
              disabled={loading}
            >
              {loading ? (
                <div className="spinner-small"></div>
              ) : (
                "Update Profile"
              )}
            </button>
          </form>
        </div>

        <div className="profile-side glass-card">
          <h3 className="section-title">Profile Tips</h3>
          <ul className="profile-list">
            <li>Use a clear name for report management.</li>
            <li>Keep your email updated for notifications.</li>
            <li>Your role controls dashboard permissions.</li>
          </ul>
        </div>
      </div>
    </AppShell>
  );
};

export default ProfilePage;
