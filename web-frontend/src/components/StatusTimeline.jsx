import { Clock, CheckCircle2, Loader, XCircle, AlertCircle } from 'lucide-react';
import './StatusTimeline.css';

const STATUS_CONFIG = {
  pending: {
    label: 'En attente',
    icon: <Clock size={16} />,
    color: '#f59e0b',
  },
  in_progress: {
    label: 'En cours',
    icon: <Loader size={16} />,
    color: '#3b82f6',
  },
  resolved: {
    label: 'Résolu',
    icon: <CheckCircle2 size={16} />,
    color: '#22c55e',
  },
  rejected: {
    label: 'Rejeté',
    icon: <XCircle size={16} />,
    color: '#ef4444',
  },
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const StatusTimeline = ({ history, compact = false }) => {
  if (!history || history.length === 0) {
    return (
      <div className="timeline-empty">
        <AlertCircle size={16} />
        <span>Aucun historique de statut</span>
      </div>
    );
  }

  // Sort by changed_at ascending
  const sorted = [...history].sort(
    (a, b) => new Date(a.changed_at) - new Date(b.changed_at)
  );

  if (compact) {
    return (
      <div className="timeline-compact">
        {sorted.map((entry, i) => {
          const config = STATUS_CONFIG[entry.status] || STATUS_CONFIG.pending;
          return (
            <div key={i} className="timeline-compact-item" title={`${config.label} — ${formatDate(entry.changed_at)}${entry.notes ? ` — ${entry.notes}` : ''}`}>
              <span className="timeline-compact-dot" style={{ background: config.color }}></span>
              <span className="timeline-compact-label" style={{ color: config.color }}>
                {config.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="status-timeline">
      {sorted.map((entry, i) => {
        const config = STATUS_CONFIG[entry.status] || STATUS_CONFIG.pending;
        const isLast = i === sorted.length - 1;

        return (
          <div key={i} className={`timeline-item ${isLast ? 'timeline-item-active' : ''}`}>
            <div className="timeline-line-container">
              <div
                className="timeline-dot"
                style={{ background: config.color, boxShadow: isLast ? `0 0 0 4px ${config.color}33` : 'none' }}
              >
                {config.icon}
              </div>
              {!isLast && <div className="timeline-line"></div>}
            </div>
            <div className="timeline-content">
              <div className="timeline-header">
                <span className="timeline-status" style={{ color: config.color }}>
                  {config.label}
                </span>
                <span className="timeline-date">{formatDate(entry.changed_at)}</span>
              </div>
              {entry.notes && (
                <p className="timeline-notes">{entry.notes}</p>
              )}
              {i > 0 && (
                <span className="timeline-delay">
                  +{getDelay(sorted[i - 1].changed_at, entry.changed_at)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

function getDelay(from, to) {
  const ms = new Date(to) - new Date(from);
  const hours = ms / (1000 * 60 * 60);
  if (hours < 1) {
    const minutes = Math.round(ms / (1000 * 60));
    return `${minutes}min`;
  }
  if (hours < 24) {
    return `${hours.toFixed(1)}h`;
  }
  const days = (hours / 24).toFixed(1);
  return `${days}j`;
}

export default StatusTimeline;
