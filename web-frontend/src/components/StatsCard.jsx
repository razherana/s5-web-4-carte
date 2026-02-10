import { useMemo } from 'react';
import { MapPin, Ruler, Wallet, TrendingUp, CheckCircle2, PlusCircle, RefreshCw, Trash2 } from 'lucide-react';
import { reportService } from '../services/reportService';
import './StatsCard.css';

const StatsCard = ({ reports }) => {
  const stats = useMemo(() => {
    if (!reports || reports.length === 0) {
      return {
        totalReports: 0,
        totalSurface: '0',
        totalBudget: '0',
        syncedReports: 0,
        createdReports: 0,
        updatedReports: 0,
        deletedReports: 0,
        syncPercentage: '0',
      };
    }
    return reportService.getStatistics(reports);
  }, [reports]);

  const statItems = [
    {
      label: 'Total Reports',
      value: stats.totalReports,
      icon: <MapPin size={20} />,
      color: 'primary',
    },
    {
      label: 'Total Surface',
      value: `${parseFloat(stats.totalSurface).toLocaleString()} m²`,
      icon: <Ruler size={20} />,
      color: 'info',
    },
    {
      label: 'Total Budget',
      value: `${parseFloat(stats.totalBudget).toLocaleString()} Ar`,
      icon: <Wallet size={20} />,
      color: 'success',
    },
    {
      label: 'Synced',
      value: `${stats.syncPercentage}%`,
      icon: <TrendingUp size={20} />,
      color: 'warning',
    },
  ];

  const syncBreakdown = [
    {
      label: 'Synced',
      value: stats.syncedReports,
      color: 'success',
      icon: <CheckCircle2 size={14} />,
    },
    {
      label: 'Created (pending)',
      value: stats.createdReports,
      color: 'info',
      icon: <PlusCircle size={14} />,
    },
    {
      label: 'Updated (pending)',
      value: stats.updatedReports,
      color: 'warning',
      icon: <RefreshCw size={14} />,
    },
    {
      label: 'Deleted (pending)',
      value: stats.deletedReports,
      color: 'danger',
      icon: <Trash2 size={14} />,
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
        <h3 className="breakdown-title">Sync Status</h3>
        <div className="breakdown-list">
          {syncBreakdown.map((status, index) => (
            <div key={index} className="breakdown-item">
              <div className="breakdown-info">
                <div className={`breakdown-indicator breakdown-${status.color}`}></div>
                <span className="breakdown-icon">{status.icon}</span>
                <span className="breakdown-label">{status.label}</span>
              </div>
              <span className="breakdown-value">{status.value}</span>
            </div>
          ))}
        </div>

        <div className="progress-bar-container">
          <div className="progress-bar-label">
            <span>Sync Progress</span>
            <span className="text-primary">{stats.syncPercentage}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${stats.syncPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
