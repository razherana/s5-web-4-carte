import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { userService } from '../services/userService';
import './ManagementPages.css';

const CreateUserPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'visitor',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.password_confirmation) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await userService.createUser(formData);
      navigate('/manager/users');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      title="Create New User"
      subtitle="Add a new user account"
      actions={
        <button
          type="button"
          onClick={() => navigate('/manager/users')}
          className="glass-button"
        >
          Back to Users
        </button>
      }
    >
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="content-card glass-card">
        <form onSubmit={handleSubmit} className="management-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name" className="form-label">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="glass-input"
                placeholder="Enter full name"
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
                placeholder="Enter email"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="glass-input"
                placeholder="Enter password"
                required
                disabled={loading}
                minLength="8"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password_confirmation" className="form-label">Confirm Password</label>
              <input
                type="password"
                id="password_confirmation"
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleChange}
                className="glass-input"
                placeholder="Confirm password"
                required
                disabled={loading}
                minLength="8"
              />
            </div>

            <div className="form-group">
              <label htmlFor="role" className="form-label">Role</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="glass-input"
                required
                disabled={loading}
              >
                <option value="visitor">Visitor</option>
                <option value="manager">Manager</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/manager/users')}
              className="glass-button"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? (
                <div className="spinner-small"></div>
              ) : (
                'Create User'
              )}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
};

export default CreateUserPage;
