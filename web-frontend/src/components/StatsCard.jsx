import { useMemo } from 'react';
import { FaChartLine, FaMapMarkerAlt, FaRulerCombined, FaWallet } from 'react-icons/fa';
import { reportService } from '../services/reportService';
import './StatsCard.css';

const StatsCard = ({ reports }) => {
  const stats = useMemo(() => {
    if (!reports || reports.length === 0) {
      return {
        totalReports: 0,
        totalSurface: '0',
        totalBudget: '0',
        completedReports: 0,
        inProgressReports: 0,
        newReports: 0,
        progressPercentage: '0',
      };
    }
    return reportService.getStatistics(reports);
  }, [reports]);

  const statItems = [
    {
      label: 'Total Reports',
      value: stats.totalReports,
      icon: <FaMapMarkerAlt />,
      color: 'primary',
    },
    {
      label: 'Total Surface',
      value: `${parseFloat(stats.totalSurface).toLocaleString()} m²`,
      icon: <FaRulerCombined />,
      color: 'info',
    },
    {
      label: 'Total Budget',
      value: `${parseFloat(stats.totalBudget).toLocaleString()} Ar`,
      icon: <FaWallet />,
      color: 'success',
    },
    {
      label: 'Progress',
      value: `${stats.progressPercentage}%`,
      icon: <FaChartLine />,
      color: 'warning',
    },
  ];

  const statusBreakdown = [
    {
      label: 'New',
      value: stats.newReports,
      color: 'info',
    },
    {
      label: 'In Progress',
      value: stats.inProgressReports,
      color: 'warning',
    },
    {
      label: 'Completed',
      value: stats.completedReports,
      color: 'success',
    },
  ];

  return (
    <div className="stats-container">
      <div className="stats-header glass-card">
        <div>
          <h3 className="stats-title">Tableau des indicateurs</h3>
          <p className="stats-subtitle">Vision globale des signalements</p>
        </div>
        <span className="stats-chip">{reports?.length || 0} rapports</span>
      </div>
      <div className="stats-grid">
        {statItems.map((item, index) => (
          <div key={index} className={`stat-card glass-card stat-${item.color}`}>
            <div className="stat-icon">{item.icon}</div>
            <div className="stat-content">
              <div className="stat-value">{item.value}</div>
              <div className="stat-label">{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="status-breakdown glass-card">
        <h3 className="breakdown-title">Status Breakdown</h3>
        <div className="breakdown-list">
          {statusBreakdown.map((status, index) => (
            <div key={index} className="breakdown-item">
              <div className="breakdown-info">
                <div className={`breakdown-indicator breakdown-${status.color}`}></div>
                <span className="breakdown-label">{status.label}</span>
              </div>
              <span className="breakdown-value">{status.value}</span>
            </div>
          ))}
        </div>

        <div className="progress-bar-container">
          <div className="progress-bar-label">
            <span>Overall Progress</span>
            <span className="text-primary">{stats.progressPercentage}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${stats.progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
