import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AppShell from '../components/AppShell';
import './AuthPages.css';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      await updateProfile(formData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Update failed. Please try again.' 
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
            <div className={`alert alert-${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="name" className="form-label">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="glass-input"
                placeholder="Enter your full name"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
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
                value={user?.role || 'visitor'}
                className="glass-input"
                disabled
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
                'Update Profile'
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
