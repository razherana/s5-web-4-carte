import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { reportService } from '../services/reportService';
import './ManagementPages.css';

const EditReportPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    surface: '',
    budget: '',
    entreprise_id: '',
    status: 'new',
    description: '',
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
        entreprise_id: report.entreprise_id || '',
        status: report.status || 'new',
        description: report.description || '',
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
          Back to Dashboard
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
              <label htmlFor="entreprise_id" className="form-label">Company ID</label>
              <input
                type="text"
                id="entreprise_id"
                name="entreprise_id"
                value={formData.entreprise_id}
                onChange={handleChange}
                className="glass-input"
                placeholder="Enter company ID"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="status" className="form-label">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="glass-input"
                required
                disabled={loading}
              >
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="form-group form-group-full">
              <label htmlFor="description" className="form-label">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="glass-input"
                placeholder="Enter description"
                rows="4"
                disabled={loading}
              ></textarea>
            </div>
          </div>

          <div className="report-info">
            <div className="info-item">
              <span className="info-label">Location:</span>
              <span className="info-value">
                {report?.latitude?.toFixed(6)}, {report?.longitude?.toFixed(6)}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Created:</span>
              <span className="info-value">
                {report?.created_at ? new Date(report.created_at).toLocaleString() : 'N/A'}
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
