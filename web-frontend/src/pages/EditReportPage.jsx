import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { reportService } from '../services/reportService';
import { ArrowLeft, MapPin, CalendarDays, Building2, Ruler, Wallet } from 'lucide-react';
import './ManagementPages.css';

const EditReportPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    surface: '',
    budget: '',
    entreprise_name: '',
    date_signalement: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (location.state?.report) {
      const report = location.state.report;
      setFormData({
        surface: report.surface || '',
        budget: report.budget || '',
        entreprise_name: report.entreprise?.name || '',
        date_signalement: report.date_signalement || '',
      });
    }
  }, [location]);

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
              <label htmlFor="budget" className="form-label">Budget (Ar)</label>
              <input
                type="number"
                id="budget"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                className="glass-input"
                placeholder="Enter budget"
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
              <span className="info-label"><Wallet size={14} /> Budget</span>
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
