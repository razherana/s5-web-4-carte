import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import MapComponent from '../components/MapComponent';
import ReportCreateModal from '../components/ReportCreateModal';
import StatsCard from '../components/StatsCard';
import AvancementCard from '../components/AvancementCard';
import { reportService } from '../services/reportService';
import { syncService } from '../services/syncService';
import { useAuth } from '../contexts/AuthContext';
import {
  RefreshCw,
  Users,
  UserCog,
  PlusCircle,
  Eye,
  FileText,
  ShieldOff,
  Upload,
  CloudDownload,
} from 'lucide-react';
import './Dashboard.css';

const ManagerDashboard = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
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
      setError('Failed to load reports. Please try to refresh the page.');
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
      setMessage({ type: 'success', text: 'Successfully synced reports with Firebase!' });
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

  const handleSyncAll = async () => {
    setSyncingAll(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await syncService.syncAll();
      const r = result.results;
      const summary = [
        `Users: ${r.users.created} created, ${r.users.updated} updated, ${r.users.deleted} deleted`,
        `Reports: ${r.signalements.created} created, ${r.signalements.updated} updated, ${r.signalements.deleted} deleted`,
        `Entreprises: ${r.entreprises.synced} synced`,
      ].join(' | ');
      setMessage({ type: 'success', text: `Full sync completed! ${summary}` });
      await loadReports();
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.message || 'Full sync failed. Please try again.' 
      });
    } finally {
      setSyncingAll(false);
    }
  };

  const handlePullFromFirebase = async () => {
    setPulling(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await syncService.pullFromFirebase();
      const r = result.results;
      const summary = [
        `Signalements: ${r.signalements.imported} imported, ${r.signalements.updated} updated`,
        `Users: ${r.users.imported} imported, ${r.users.updated} updated`,
      ].join(' | ');
      setMessage({ type: 'success', text: `Pull from Firebase completed! ${summary}` });
      await loadReports();
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.message || 'Pull failed. Please try again.' 
      });
    } finally {
      setPulling(false);
    }
  };

  const handleReportClick = (report) => {
    navigate('/manager/reports/edit', { state: { report } });
  };

  const handleAddReport = (location) => {
    setSelectedLocation(location);
    setIsCreateOpen(true);
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
        <>
          <button
            onClick={handlePullFromFirebase}
            className="glass-button"
            disabled={pulling}
            title="Retrieve data from Firebase"
          >
            {pulling ? (
              <>
                <div className="spinner-small"></div>
                <span>Pulling...</span>
              </>
            ) : (
              <>
                <span className="button-icon"><CloudDownload size={16} /></span>
                <span>Pull Firebase</span>
              </>
            )}
          </button>
          <button
            onClick={handleSyncAll}
            className="glass-button"
            disabled={syncingAll}
            title="Sync all data to Firebase"
          >
            {syncingAll ? (
              <>
                <div className="spinner-small"></div>
                <span>Syncing All...</span>
              </>
            ) : (
              <>
                <span className="button-icon"><Upload size={16} /></span>
                <span>Sync All</span>
              </>
            )}
          </button>
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
                <span className="button-icon"><RefreshCw size={16} /></span>
                <span>Sync Reports</span>
              </>
            )}
          </button>
        </>
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
              <span className="metric-label">Pending</span>
              <span className="metric-value">{stats.pendingReports}</span>
            </div>
            <div className="hero-metric">
              <span className="metric-label">In Progress</span>
              <span className="metric-value">{stats.inProgressReports}</span>
            </div>
            <div className="hero-metric">
              <span className="metric-label">Resolved</span>
              <span className="metric-value">{stats.resolvedReports}</span>
            </div>
            <div className="hero-metric">
              <span className="metric-label">Sync Rate</span>
              <span className="metric-value">{stats.syncPercentage}%</span>
            </div>
          </div>
        </section>

        <section className="dashboard-row">
          <div className="dashboard-column">
            <StatsCard reports={reports} />
            <AvancementCard reports={reports} />
            
            <div className="quick-actions glass-card">
              <h3 className="section-title">Quick Actions</h3>
              <div className="quick-actions-grid">
                <button
                  className="glass-button"
                  onClick={() => navigate('/manager/users')}
                >
                  <Users size={16} />
                  <span>Manage Users</span>
                </button>
                <button
                  className="glass-button"
                  onClick={() => navigate('/manager/reports')}
                >
                  <FileText size={16} />
                  <span>Manage Reports</span>
                </button>
                <button
                  className="glass-button"
                  onClick={() => navigate('/manager/users/blocked')}
                >
                  <ShieldOff size={16} />
                  <span>Blocked Users</span>
                </button>
                <button
                  className="glass-button"
                  onClick={() => navigate('/manager/users/create')}
                >
                  <PlusCircle size={16} />
                  <span>Create User</span>
                </button>
                <Link className="glass-button" to="/profile">
                  <UserCog size={16} />
                  <span>Profile Settings</span>
                </Link>
                <Link className="glass-button" to="/visitor/dashboard">
                  <Eye size={16} />
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
                <div className="legend-dot legend-synced"></div>
                <span>Synced</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot legend-created"></div>
                <span>Created</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot legend-updated"></div>
                <span>Updated</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot legend-deleted"></div>
                <span>Deleted</span>
              </div>
            </div>
            <div className="map-helper">
              <span>Astuce :</span> cliquez sur la carte pour déposer un marqueur, puis cliquez sur le marqueur pour signaler.
            </div>
          </div>
          <MapComponent
            reports={reports}
            readOnly={false}
            onReportClick={handleReportClick}
            canAddReport={true}
            onAddReport={handleAddReport}
          />
        </section>
      </div>
      <ReportCreateModal
        isOpen={isCreateOpen}
        location={selectedLocation}
        onClose={() => setIsCreateOpen(false)}
        onCreated={loadReports}
      />
    </AppShell>
  );
};

export default ManagerDashboard;
