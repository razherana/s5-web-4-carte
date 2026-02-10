import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import MapComponent from "../components/MapComponent";
import StatsCard from "../components/StatsCard";
import ReportCreateModal from "../components/ReportCreateModal";
import { reportService } from "../services/reportService";
import "./Dashboard.css";
import { useAuth } from "../contexts/AuthContext";

const VisitorDashboard = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await reportService.getAllReports();
      setReports(data);
      setError("");
    } catch (err) {
      setError("Failed to load reports. Please try to refresh the page.");
      console.error("Error loading reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReport = (location) => {
    if (!isAuthenticated) return;
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
      title="Dashboard"
      subtitle="Explore live reports and city insights"
      actions={
        !isAuthenticated && (
          <Link to="/login" className="btn-primary">
            Sign In to Manage
          </Link>
        )
      }
    >
      {error && <div className="alert alert-error">{error}</div>}

      <div className="dashboard-grid">
        <section className="dashboard-hero glass-card">
          <div>
            <h2 className="hero-title">City Overview</h2>
            <p className="hero-subtitle">
              A quick snapshot of the active reports and their progress.
            </p>
          </div>
          <div className="hero-metrics">
            <div className="hero-metric">
              <span className="metric-label">Total Reports</span>
              <span className="metric-value">{stats.totalReports}</span>
            </div>
            <div className="hero-metric">
              <span className="metric-label">Synced</span>
              <span className="metric-value">{stats.syncedReports}</span>
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
            {isAuthenticated && (
              <div className="map-helper">
                <span>Astuce :</span> cliquez sur la carte pour déposer un marqueur, puis cliquez sur le marqueur pour signaler.
              </div>
            )}
          </div>
          <MapComponent
            reports={reports}
            readOnly={true}
            canAddReport={isAuthenticated}
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

export default VisitorDashboard;
