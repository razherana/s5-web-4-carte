import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import MapComponent from "../components/MapComponent";
import StatsCard from "../components/StatsCard";
import { reportService } from "../services/reportService";
import "./Dashboard.css";
import { useAuth } from "../contexts/AuthContext";

const VisitorDashboard = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      setError("Failed to load reports. Please try again.");
      console.error("Error loading reports:", err);
    } finally {
      setLoading(false);
    }
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
              <span className="metric-label">Completed</span>
              <span className="metric-value">{stats.completedReports}</span>
            </div>
            <div className="hero-metric">
              <span className="metric-label">Progress</span>
              <span className="metric-value">{stats.progressPercentage}%</span>
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
          <MapComponent reports={reports} readOnly={true} />
        </section>
      </div>
    </AppShell>
  );
};

export default VisitorDashboard;
