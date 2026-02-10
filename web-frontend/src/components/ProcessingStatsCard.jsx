import { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';
import { BarChart3, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import './StatusTimeline.css';

const STATUS_LABELS = {
  pending: 'En attente',
  in_progress: 'En cours',
  resolved: 'Résolu',
  rejected: 'Rejeté',
};

const ProcessingStatsCard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await reportService.getProcessingStats();
      setStats(data);
      setError('');
    } catch (err) {
      setError('Impossible de charger les statistiques de traitement.');
      console.error('Error loading processing stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="processing-stats-card glass-card content-card">
        <h3><BarChart3 size={18} /> Délais de traitement</h3>
        <div className="stats-no-data">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="processing-stats-card glass-card content-card">
        <h3><BarChart3 size={18} /> Délais de traitement</h3>
        <div className="stats-no-data" style={{ color: 'var(--danger)' }}>
          <AlertCircle size={16} /> {error}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const { average_delays, summary } = stats;

  return (
    <div className="processing-stats-card glass-card content-card">
      <h3><BarChart3 size={18} /> Délais de traitement</h3>
      <p className="stats-subtitle">
        Temps moyen entre chaque étape d'avancement
      </p>

      {/* Summary */}
      {summary && (
        <div className="stats-summary-row">
          <div className="stats-summary-item">
            <span className="stats-summary-value">
              {summary.avg_resolution_hours !== null
                ? `${summary.avg_resolution_hours}h`
                : 'N/A'}
            </span>
            <span className="stats-summary-label">
              <Clock size={12} /> Temps résolution moyen (heures)
            </span>
          </div>
          <div className="stats-summary-item">
            <span className="stats-summary-value">
              {summary.avg_resolution_days !== null
                ? `${summary.avg_resolution_days}j`
                : 'N/A'}
            </span>
            <span className="stats-summary-label">
              <TrendingUp size={12} /> Temps résolution moyen (jours)
            </span>
          </div>
          <div className="stats-summary-item">
            <span className="stats-summary-value">
              {summary.total_resolved ?? 0}
            </span>
            <span className="stats-summary-label">
              Signalements résolus
            </span>
          </div>
        </div>
      )}

      {/* Transition delays table */}
      {average_delays && average_delays.length > 0 ? (
        <div className="table-container">
          <table className="stats-transition-table">
            <thead>
              <tr>
                <th>Transition</th>
                <th>Délai moyen (heures)</th>
                <th>Délai moyen (jours)</th>
                <th>Nombre</th>
              </tr>
            </thead>
            <tbody>
              {average_delays.map((row, i) => (
                <tr key={i}>
                  <td>
                    <span className="transition-arrow">
                      <span className="transition-from">
                        {STATUS_LABELS[row.from_status] || row.from_status}
                      </span>
                      →
                      <span className="transition-to">
                        {STATUS_LABELS[row.to_status] || row.to_status}
                      </span>
                    </span>
                  </td>
                  <td><strong>{row.avg_hours}h</strong></td>
                  <td>{row.avg_days}j</td>
                  <td>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="stats-no-data">
          Pas encore de données de transition. Les statistiques apparaîtront au fur et à mesure des changements de statut.
        </div>
      )}
    </div>
  );
};

export default ProcessingStatsCard;
