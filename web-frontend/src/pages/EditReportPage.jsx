import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppShell from '../components/AppShell';
import StatusTimeline from '../components/StatusTimeline';
import { reportService } from '../services/reportService';
import { ArrowLeft, MapPin, CalendarDays, Building2, Ruler, Wallet, Plus } from 'lucide-react';
import './ManagementPages.css';

const EditReportPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    surface: '',
    niveau: '1',
    prix_par_m2: '',
    entreprise_name: '',
    date_signalement: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [statusHistory, setStatusHistory] = useState([]);
  const [newStatus, setNewStatus] = useState('');
  const [statusDate, setStatusDate] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [addingStatus, setAddingStatus] = useState(false);

  useEffect(() => {
    if (location.state?.report) {
      const report = location.state.report;
      setFormData({
        surface: report.surface || '',
        niveau: report.niveau || '1',
        prix_par_m2: report.prix_par_m2 || '',
        entreprise_name: report.entreprise?.name || '',
        date_signalement: report.date_signalement || '',
        notes: report.notes || '',
      });
      // Load status history
      setStatusHistory(report.status_history || []);
      loadStatusHistory(report.id || report.firebase_uid);
    }
  }, [location]);

  const loadStatusHistory = async (id) => {
    if (!id) return;
    try {
      const data = await reportService.getStatusHistory(id);
      if (data && Array.isArray(data)) {
        setStatusHistory(data);
      }
    } catch (err) {
      console.error('Error loading status history:', err);
    }
  };

  const handleAddStatusChange = async () => {
    if (!newStatus || !statusDate) return;
    const reportId = location.state?.report?.id || location.state?.report?.firebase_uid;
    if (!reportId) return;

    setAddingStatus(true);
    try {
      await reportService.addStatusChange(reportId, {
        status: newStatus,
        changed_at: statusDate,
        notes: statusNotes || undefined,
      });
      setMessage({ type: 'success', text: `Statut changé en "${newStatus}"` });
      setNewStatus('');
      setStatusDate('');
      setStatusNotes('');
      await loadStatusHistory(reportId);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors du changement de statut' });
    } finally {
      setAddingStatus(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      const reportId = location.state?.report?.id;
      if (reportId) {
        await reportService.updateReport(reportId, formData);
        setMessage({ type: 'success', text: 'Report updated successfully!' });
        setTimeout(() => navigate('/manager/dashboard'), 1500);
      } else {
        setError('Invalid report ID');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const report = location.state?.report;

  return (
    <AppShell
      title={`Edit Report #${report?.id || ''}`}
      subtitle="Update report information"
      actions={
        <button
          type="button"
          onClick={() => navigate('/manager/dashboard')}
          className="glass-button"
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
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

      <div className="content-card glass-card">
        <form onSubmit={handleSubmit} className="management-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="surface" className="form-label">Surface Area (m²)</label>
              <input
                type="number"
                id="surface"
                name="surface"
                value={formData.surface}
                onChange={handleChange}
                className="glass-input"
                placeholder="Enter surface area"
                step="0.01"
                min="0"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="niveau" className="form-label">Niveau (1-10)</label>
              <input
                type="number"
                id="niveau"
                name="niveau"
                value={formData.niveau}
                onChange={handleChange}
                className="glass-input"
                placeholder="1-10"
                min="1"
                max="10"
                step="1"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="prix_par_m2" className="form-label">Prix par m² (Ar)</label>
              <input
                type="number"
                id="prix_par_m2"
                name="prix_par_m2"
                value={formData.prix_par_m2}
                onChange={handleChange}
                className="glass-input"
                placeholder="Enter price per m²"
                step="0.01"
                min="0"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="entreprise_name" className="form-label">Company Name</label>
              <input
                type="text"
                id="entreprise_name"
                name="entreprise_name"
                value={formData.entreprise_name}
                onChange={handleChange}
                className="glass-input"
                placeholder="Enter company name"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="date_signalement" className="form-label">Report Date</label>
              <input
                type="date"
                id="date_signalement"
                name="date_signalement"
                value={formData.date_signalement}
                onChange={handleChange}
                className="glass-input"
                disabled={loading}
              />
            </div>

            <div className="form-group form-group-full">
              <label htmlFor="notes" className="form-label">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="glass-input"
                placeholder="Add notes about this report..."
                rows={3}
                disabled={loading}
              />
            </div>
          </div>

          {/* Computed Budget Display */}
          {formData.surface && formData.niveau && formData.prix_par_m2 && (
            <div className="budget-display glass-card">
              <div className="budget-display-label">Budget calculé</div>
              <div className="budget-display-value">
                {(
                  Number(formData.surface) *
                  Number(formData.niveau) *
                  Number(formData.prix_par_m2)
                ).toLocaleString()}
                <span className="budget-display-unit">Ar</span>
              </div>
              <div className="budget-display-formula">
                {Number(formData.prix_par_m2).toFixed(2)} × {formData.niveau} × {Number(formData.surface).toFixed(2)}
              </div>
            </div>
          )}

          {/* Status History Timeline */}
          <div className="form-group form-group-full">
            <label className="form-label">Historique des statuts</label>
            <StatusTimeline history={statusHistory} />

            {/* Add status change form */}
            <div className="status-change-form">
              <div className="form-group">
                <label className="form-label">Nouveau statut</label>
                <select
                  className="glass-input"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  disabled={addingStatus}
                >
                  <option value="">-- Choisir --</option>
                  <option value="pending">En attente</option>
                  <option value="in_progress">En cours</option>
                  <option value="resolved">Résolu</option>
                  <option value="rejected">Rejeté</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date et heure</label>
                <input
                  type="datetime-local"
                  className="glass-input"
                  value={statusDate}
                  onChange={(e) => setStatusDate(e.target.value)}
                  disabled={addingStatus}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Note (optionnel)</label>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="Raison du changement..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  disabled={addingStatus}
                />
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={handleAddStatusChange}
                disabled={!newStatus || !statusDate || addingStatus}
              >
                {addingStatus ? '...' : <><Plus size={14} /> Ajouter</>}
              </button>
            </div>
          </div>

          <div className="report-info">
            <div className="info-item">
              <span className="info-label"><MapPin size={14} /> Location</span>
              <span className="info-value">
                {report?.lat?.toFixed(6)}, {report?.lng?.toFixed(6)}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label"><CalendarDays size={14} /> Report Date</span>
              <span className="info-value">
                {report?.date_signalement || 'N/A'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label"><Building2 size={14} /> Company</span>
              <span className="info-value">
                {report?.entreprise?.name || 'N/A'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label"><Ruler size={14} /> Surface</span>
              <span className="info-value">
                {report?.surface ? `${report.surface} m²` : 'N/A'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label"><Wallet size={14} /> Niveau</span>
              <span className="info-value">
                {report?.niveau || 1}/10
              </span>
            </div>
            <div className="info-item">
              <span className="info-label"><Wallet size={14} /> Prix/m²</span>
              <span className="info-value">
                {report?.prix_par_m2 ? `${parseFloat(report.prix_par_m2).toLocaleString()} Ar` : 'N/A'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label"><Wallet size={14} /> Budget (calculé)</span>
              <span className="info-value">
                {report?.budget ? `${parseFloat(report.budget).toLocaleString()} Ar` : 'N/A'}
              </span>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/manager/dashboard')}
              className="glass-button"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? (
                <div className="spinner-small"></div>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
};

export default EditReportPage;
