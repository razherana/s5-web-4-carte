import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import StatusTimeline from "../components/StatusTimeline";
import ProcessingStatsCard from "../components/ProcessingStatsCard";
import { reportService } from "../services/reportService";
import {
  FileText,
  RefreshCw,
  Pencil,
  Trash2,
  Search,
  MapPin,
  Building2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import "./ManagementPages.css";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", className: "status-pending" },
  {
    value: "in_progress",
    label: "In Progress",
    className: "status-in-progress",
  },
  { value: "resolved", label: "Resolved", className: "status-resolved" },
  { value: "rejected", label: "Rejected", className: "status-rejected" },
];

const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("desc");
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [statusChangeRow, setStatusChangeRow] = useState(null);
  const [statusChangeData, setStatusChangeData] = useState({
    status: "",
    changed_at: "",
    notes: "",
  });
  const navigate = useNavigate();

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

  const handleStatusChange = async (reportId) => {
    if (!statusChangeData.status || !statusChangeData.changed_at) return;
    setUpdatingStatus(reportId);
    try {
      await reportService.addStatusChange(reportId, {
        status: statusChangeData.status,
        changed_at: statusChangeData.changed_at,
        notes: statusChangeData.notes || undefined,
      });
      await loadReports();
      setMessage({
        type: "success",
        text: `Report #${reportId} status updated to "${statusChangeData.status}"`,
      });
      setStatusChangeRow(null);
      setStatusChangeData({ status: "", changed_at: "", notes: "" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "Failed to update status",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const openStatusChangeRow = (reportId, currentStatus) => {
    setStatusChangeRow(reportId);
    setStatusChangeData({ status: currentStatus, changed_at: "", notes: "" });
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm(`Are you sure you want to delete report #${reportId}?`))
      return;

    try {
      await reportService.deleteReport(reportId);
      setMessage({
        type: "success",
        text: `Report #${reportId} deleted successfully!`,
      });
      await loadReports();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "Failed to delete report.",
      });
    }
  };

  const handleEdit = (report) => {
    navigate("/manager/reports/edit", { state: { report } });
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp size={14} />
    ) : (
      <ChevronDown size={14} />
    );
  };

  // Filtering
  const filteredReports = reports
    .filter((r) => {
      if (statusFilter !== "all" && (r.status || "pending") !== statusFilter)
        return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          String(r.id).includes(term) ||
          (r.entreprise?.name || "").toLowerCase().includes(term) ||
          (r.user?.email || "").toLowerCase().includes(term) ||
          String(r.lat).includes(term) ||
          String(r.lng).includes(term)
        );
      }
      return true;
    })
    .sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField === "entreprise") {
        aVal = a.entreprise?.name || "";
        bVal = b.entreprise?.name || "";
      }
      if (typeof aVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDirection === "asc"
        ? (aVal || 0) - (bVal || 0)
        : (bVal || 0) - (aVal || 0);
    });

  const stats = reportService.getStatistics(reports);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
        <p>Loading reports...</p>
      </div>
    );
  }

  return (
    <AppShell
      title="Reports Management"
      subtitle="Manage all signalements: status, details, and synchronization"
      actions={
        <button onClick={loadReports} className="glass-button">
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      }
    >
      {error && <div className="alert alert-error">{error}</div>}
      {message.text && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      {/* Status overview cards */}
      <div className="reports-status-overview">
        <div
          className={`status-overview-card ${statusFilter === "all" ? "active" : ""}`}
          onClick={() => setStatusFilter("all")}
        >
          <span className="status-count">{stats.totalReports}</span>
          <span className="status-label-text">All</span>
        </div>
        <div
          className={`status-overview-card status-pending-card ${statusFilter === "pending" ? "active" : ""}`}
          onClick={() => setStatusFilter("pending")}
        >
          <span className="status-count">{stats.pendingReports}</span>
          <span className="status-label-text">Pending</span>
        </div>
        <div
          className={`status-overview-card status-in-progress-card ${statusFilter === "in_progress" ? "active" : ""}`}
          onClick={() => setStatusFilter("in_progress")}
        >
          <span className="status-count">{stats.inProgressReports}</span>
          <span className="status-label-text">In Progress</span>
        </div>
        <div
          className={`status-overview-card status-resolved-card ${statusFilter === "resolved" ? "active" : ""}`}
          onClick={() => setStatusFilter("resolved")}
        >
          <span className="status-count">{stats.resolvedReports}</span>
          <span className="status-label-text">Resolved</span>
        </div>
        <div
          className={`status-overview-card status-rejected-card ${statusFilter === "rejected" ? "active" : ""}`}
          onClick={() => setStatusFilter("rejected")}
        >
          <span className="status-count">{stats.rejectedReports}</span>
          <span className="status-label-text">Rejected</span>
        </div>
      </div>

      {/* Search & filter bar */}
      <div className="reports-toolbar glass-card">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            className="glass-input"
            placeholder="Search by ID, company, email, coordinates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Reports table */}
      <div className="content-card glass-card">
        {filteredReports.length === 0 ? (
          <div className="empty-state">
            <p className="empty-icon">
              <FileText size={40} />
            </p>
            <p className="empty-text">
              {reports.length === 0
                ? "No reports found"
                : "No reports match your filters"}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort("id")}>
                    <div className="sortable-th">
                      ID <SortIcon field="id" />
                    </div>
                  </th>
                  <th>Location</th>
                  <th onClick={() => handleSort("date_signalement")}>
                    <div className="sortable-th">
                      Date <SortIcon field="date_signalement" />
                    </div>
                  </th>
                  <th onClick={() => handleSort("surface")}>
                    <div className="sortable-th">
                      Surface (m²) <SortIcon field="surface" />
                    </div>
                  </th>
                  <th onClick={() => handleSort("niveau")}>
                    <div className="sortable-th">
                      Niveau <SortIcon field="niveau" />
                    </div>
                  </th>
                  <th onClick={() => handleSort("prix_par_m2")}>
                    <div className="sortable-th">
                      Prix/m² (Ar) <SortIcon field="prix_par_m2" />
                    </div>
                  </th>
                  <th onClick={() => handleSort("budget")}>
                    <div className="sortable-th">
                      Budget (Ar) <SortIcon field="budget" />
                    </div>
                  </th>
                  <th onClick={() => handleSort("entreprise")}>
                    <div className="sortable-th">
                      Company <SortIcon field="entreprise" />
                    </div>
                  </th>
                  <th>Status</th>
                  <th>Historique</th>
                  <th>Sync</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => {
                  const reportKey = report.id || report.firebase_uid;
                  return (
                    <React.Fragment key={reportKey}>
                      <tr>
                        <td>
                          #{report.id || report.firebase_uid?.slice(0, 8)}
                        </td>
                        <td>
                          <span className="location-cell">
                            <MapPin size={12} />
                            {parseFloat(report.lat).toFixed(4)},{" "}
                            {parseFloat(report.lng).toFixed(4)}
                          </span>
                        </td>
                        <td>{report.date_signalement || "N/A"}</td>
                        <td>
                          {report.surface
                            ? `${parseFloat(report.surface).toLocaleString()}`
                            : "N/A"}
                        </td>
                        <td>{report.niveau ?? 1}/10</td>
                        <td>
                          {report.prix_par_m2
                            ? `${parseFloat(report.prix_par_m2).toLocaleString()}`
                            : "N/A"}
                        </td>
                        <td>
                          {report.budget
                            ? `${parseFloat(report.budget).toLocaleString()}`
                            : "N/A"}
                        </td>
                        <td>
                          <span className="company-cell">
                            <Building2 size={12} />
                            {report.entreprise?.name || "N/A"}
                          </span>
                        </td>
                        <td>
                          <button
                            className={`status-badge-btn status-select-${report.status || "pending"}`}
                            onClick={() =>
                              openStatusChangeRow(
                                reportKey,
                                report.status || "pending",
                              )
                            }
                            disabled={updatingStatus === reportKey}
                            title="Cliquer pour changer le statut"
                          >
                            {STATUS_OPTIONS.find(
                              (o) => o.value === (report.status || "pending"),
                            )?.label || "Pending"}
                          </button>
                        </td>
                        <td>
                          <StatusTimeline
                            history={report.status_history || []}
                            compact={true}
                          />
                        </td>
                        <td>
                          <span
                            className={`sync-badge sync-${report.synced || "created"}`}
                          >
                            {report.synced || "created"}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => handleEdit(report)}
                              className="btn-action btn-edit"
                              title="Edit report"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(reportKey)}
                              className="btn-action btn-danger"
                              title="Delete report"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {statusChangeRow === reportKey && (
                        <tr className="status-change-row">
                          <td colSpan="12">
                            <div className="status-change-inline-form">
                              <div className="status-change-inline-field">
                                <label>Statut</label>
                                <select
                                  className="glass-input"
                                  value={statusChangeData.status}
                                  onChange={(e) =>
                                    setStatusChangeData((d) => ({
                                      ...d,
                                      status: e.target.value,
                                    }))
                                  }
                                >
                                  {STATUS_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="status-change-inline-field">
                                <label>Date et heure</label>
                                <input
                                  type="datetime-local"
                                  className="glass-input"
                                  value={statusChangeData.changed_at}
                                  onChange={(e) =>
                                    setStatusChangeData((d) => ({
                                      ...d,
                                      changed_at: e.target.value,
                                    }))
                                  }
                                  required
                                />
                              </div>
                              <div className="status-change-inline-field">
                                <label>Note (optionnel)</label>
                                <input
                                  type="text"
                                  className="glass-input"
                                  placeholder="Raison..."
                                  value={statusChangeData.notes}
                                  onChange={(e) =>
                                    setStatusChangeData((d) => ({
                                      ...d,
                                      notes: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                              <div className="status-change-inline-actions">
                                <button
                                  className="btn-primary"
                                  onClick={() => handleStatusChange(reportKey)}
                                  disabled={
                                    !statusChangeData.status ||
                                    !statusChangeData.changed_at ||
                                    updatingStatus
                                  }
                                >
                                  {updatingStatus ? "..." : "Valider"}
                                </button>
                                <button
                                  className="glass-button"
                                  onClick={() => {
                                    setStatusChangeRow(null);
                                    setStatusChangeData({
                                      status: "",
                                      changed_at: "",
                                      notes: "",
                                    });
                                  }}
                                >
                                  Annuler
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Processing time statistics */}
      <ProcessingStatsCard />

      {/* Summary footer */}
      <div className="reports-summary glass-card">
        <div className="summary-item">
          <span className="summary-label">Total Surface</span>
          <span className="summary-value">
            {parseFloat(stats.totalSurface).toLocaleString()} m²
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Total Budget</span>
          <span className="summary-value">
            {parseFloat(stats.totalBudget).toLocaleString()} Ar
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Sync Rate</span>
          <span className="summary-value">{stats.syncPercentage}%</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Showing</span>
          <span className="summary-value">
            {filteredReports.length} / {reports.length}
          </span>
        </div>
      </div>
    </AppShell>
  );
};

export default ReportsPage;
