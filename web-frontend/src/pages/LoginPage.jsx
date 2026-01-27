import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaKey, FaUserShield } from 'react-icons/fa';
import './AuthPages.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isManager } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Redirect based on role
      if (isManager()) {
        navigate('/manager/dashboard');
      } else {
        navigate('/visitor/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    const demoEmail = 'manager@demo.local';
    const demoPassword = 'Manager123!';
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setLoading(true);

    try {
      await login(demoEmail, demoPassword);
      navigate('/manager/dashboard');
    } catch (err) {
      setError('Demo login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-card">
        <div className="auth-header">
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to continue to your dashboard</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input"
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input"
              placeholder="Enter your password"
              required
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
              'Sign In'
            )}
          </button>
        </form>

        <div className="demo-access glass-card">
          <div className="demo-header">
            <FaUserShield />
            <span>Manager Demo Access</span>
          </div>
          <div className="demo-credentials">
            <div className="demo-row">
              <span className="demo-label">Email</span>
              <span className="demo-value">manager@demo.local</span>
            </div>
            <div className="demo-row">
              <span className="demo-label">Password</span>
              <span className="demo-value">Manager123!</span>
            </div>
          </div>
          <button
            type="button"
            className="glass-button demo-button"
            onClick={handleDemoLogin}
            disabled={loading}
          >
            <FaKey />
            <span>Use demo manager</span>
          </button>
        </div>

        <div className="auth-footer">
          <p className="text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Sign up
            </Link>
          </p>
          <p className="text-muted">
            <Link to="/visitor/dashboard" className="auth-link">
              Continue as visitor
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
