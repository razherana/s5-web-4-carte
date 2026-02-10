import { useMemo, useState, useEffect } from 'react';
import { reportService } from '../services/reportService';
import { CheckCircle2, Clock, Loader, XCircle, Timer } from 'lucide-react';
import './AvancementCard.css';

const AvancementCard = ({ reports }) => {
  const [processingStats, setProcessingStats] = useState(null);

  useEffect(() => {
    loadProcessingStats();
  }, []);

  const loadProcessingStats = async () => {
    try {
      const data = await reportService.getProcessingStats();
      setProcessingStats(data);
    } catch {
      // Silently fail - stats are optional enhancement
    }
  };

  const stats = useMemo(() => {
    if (!reports || reports.length === 0) {
      return {
        totalReports: 0,
        pendingReports: 0,
        inProgressReports: 0,
        resolvedReports: 0,
        rejectedReports: 0,
        avancement: 0,
      };
    }
    return reportService.getStatistics(reports);
  }, [reports]);

  const avancement = parseFloat(stats.avancement);

  const getAvancementColor = (value) => {
    if (value >= 75) return 'var(--success, #16a34a)';
    if (value >= 40) return 'var(--primary, #2563eb)';
    if (value >= 15) return 'var(--warning, #f59e0b)';
    return 'var(--danger, #ef4444)';
  };

  const statusBreakdown = [
    {
      label: 'Résolu',
      count: stats.resolvedReports,
      weight: '×1',
      icon: <CheckCircle2 size={16} />,
      color: '#16a34a',
    },
    {
      label: 'En cours',
      count: stats.inProgressReports,
      weight: '×0.5',
      icon: <Loader size={16} />,
      color: '#2563eb',
    },
    {
      label: 'En attente',
      count: stats.pendingReports,
      weight: '×0',
      icon: <Clock size={16} />,
      color: '#f59e0b',
    },
    {
      label: 'Rejeté',
      count: stats.rejectedReports,
      weight: '×0',
      icon: <XCircle size={16} />,
      color: '#ef4444',
    },
  ];

  return (
    <div className="avancement-card glass-card">
      <div className="avancement-header">
        <div>
          <h3 className="avancement-title">Avancement global</h3>
          <p className="avancement-subtitle">Progression des signalements</p>
        </div>
        <div
          className="avancement-percentage"
          style={{ color: getAvancementColor(avancement) }}
        >
          {stats.avancement}%
        </div>
      </div>

      <div className="avancement-progress-container">
        <div className="avancement-progress-bar">
          <div
            className="avancement-progress-fill"
            style={{
              width: `${avancement}%`,
              background: `linear-gradient(90deg, ${getAvancementColor(avancement)}, ${getAvancementColor(avancement)}dd)`,
            }}
          ></div>
        </div>
        <div className="avancement-progress-labels">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      <div className="avancement-breakdown">
        {statusBreakdown.map((item, index) => (
          <div key={index} className="avancement-breakdown-item">
            <div className="avancement-breakdown-left">
              <span className="avancement-breakdown-icon" style={{ color: item.color }}>
                {item.icon}
              </span>
              <span className="avancement-breakdown-label">{item.label}</span>
              <span className="avancement-breakdown-weight">{item.weight}</span>
            </div>
            <span className="avancement-breakdown-count">{item.count}</span>
          </div>
        ))}
      </div>

      <div className="avancement-formula">
        <span>
          ({stats.resolvedReports}×1 + {stats.inProgressReports}×0.5) / {stats.totalReports || 1} = <strong>{stats.avancement}%</strong>
        </span>
      </div>

      {processingStats?.summary?.avg_resolution_days !== null && processingStats?.summary?.avg_resolution_days !== undefined && (
        <div className="avancement-processing-time">
          <Timer size={14} />
          <span>
            Délai moyen de résolution : <strong>{processingStats.summary.avg_resolution_days}j</strong> ({processingStats.summary.avg_resolution_hours}h)
          </span>
        </div>
      )}
    </div>
  );
};

export default AvancementCard;
