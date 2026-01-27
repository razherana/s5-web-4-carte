import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import MapComponent from '../components/MapComponent';
import StatsCard from '../components/StatsCard';
import { reportService } from '../services/reportService';
import { useAuth } from '../contexts/AuthContext';
import { FaSyncAlt, FaUserCog, FaUsers } from 'react-icons/fa';
import './Dashboard.css';

const ManagerDashboard = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await reportService.getAllReports();
      setReports(data);
      setError('');
    } catch (err) {
      setError('Failed to load reports. Please try again.');
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setMessage({ type: '', text: '' });

    try {
      await reportService.syncWithFirebase();
      setMessage({ type: 'success', text: 'Successfully synced with Firebase!' });
      await loadReports();
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Sync failed. Please try again.' 
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleReportClick = (report) => {
    navigate('/manager/reports/edit', { state: { report } });
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const stats = reportService.getStatistics(reports);

  return (
    <AppShell
      title="Manager Dashboard"
      subtitle={`Welcome back, ${user?.name || 'Manager'}`}
      actions={
        <button
          onClick={handleSync}
          className="glass-button"
          disabled={syncing}
        >
          {syncing ? (
            <>
              <div className="spinner-small"></div>
              <span>Syncing...</span>
            </>
          ) : (
            <>
              <span className="button-icon"><FaSyncAlt /></span>
              <span>Sync Firebase</span>
            </>
          )}
        </button>
      }
    >
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="dashboard-grid">
        <section className="dashboard-hero glass-card">
          <div>
            <h2 className="hero-title">Operational Snapshot</h2>
            <p className="hero-subtitle">Track progress and take action quickly.</p>
          </div>
          <div className="hero-metrics">
            <div className="hero-metric">
              <span className="metric-label">Total Reports</span>
              <span className="metric-value">{stats.totalReports}</span>
            </div>
            <div className="hero-metric">
              <span className="metric-label">In Progress</span>
              <span className="metric-value">{stats.inProgressReports}</span>
            </div>
            <div className="hero-metric">
              <span className="metric-label">Completion</span>
              <span className="metric-value">{stats.progressPercentage}%</span>
            </div>
          </div>
        </section>

        <section className="dashboard-row">
          <div className="dashboard-column">
            <StatsCard reports={reports} />
            
            <div className="quick-actions glass-card">
              <h3 className="section-title">Quick Actions</h3>
              <div className="quick-actions-grid">
                <button
                  className="glass-button"
                  onClick={() => navigate('/manager/users')}
                >
                  <FaUsers />
                  <span>Manage Users</span>
                </button>
                <Link className="glass-button" to="/profile">
                  <FaUserCog />
                  <span>Profile Settings</span>
                </Link>
                <Link className="glass-button" to="/visitor/dashboard">
                  <span>Visitor View</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="dashboard-map glass-card">
          <div className="section-header">
            <h2 className="section-title">Reports Map</h2>
            <div className="map-legend">
              <div className="legend-item">
                <div className="legend-dot legend-new"></div>
                <span>New</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot legend-in-progress"></div>
                <span>In Progress</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot legend-completed"></div>
                <span>Completed</span>
              </div>
            </div>
          </div>
          <MapComponent
            reports={reports}
            readOnly={false}
            onReportClick={handleReportClick}
          />
        </section>
      </div>
    </AppShell>
  );
};

export default ManagerDashboard;
