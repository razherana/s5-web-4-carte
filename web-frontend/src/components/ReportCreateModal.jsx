import { useEffect, useMemo, useState } from 'react';
import { reportService } from '../services/reportService';
import { useAuth } from '../contexts/AuthContext';
import './ReportCreateModal.css';

const problemTypes = [
  { value: 'nid_poule', label: 'Nid de poule' },
  { value: 'fissure', label: 'Fissure' },
  { value: 'affaissement', label: 'Affaissement' },
  { value: 'degradation', label: 'Dégradation' },
  { value: 'autre', label: 'Autre' },
];

const ReportCreateModal = ({ isOpen, location, onClose, onCreated }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    description: '',
    problem_type: 'nid_poule',
    surface: '',
    budget: '',
    entreprise_id: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const coordsText = useMemo(() => {
    if (!location) return '';
    return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
  }, [location]);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        description: '',
        problem_type: 'nid_poule',
        surface: '',
        budget: '',
        entreprise_id: '',
      });
      setError('');
      setSubmitting(false);
    }
  }, [isOpen]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user) {
      setError('Vous devez être connecté pour créer un signalement.');
      return;
    }

    if (!formData.description.trim()) {
      setError('La description est obligatoire.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        description: formData.description.trim(),
        problem_type: formData.problem_type,
        surface: formData.surface ? Number(formData.surface) : null,
        budget: formData.budget ? Number(formData.budget) : null,
        entreprise_id: formData.entreprise_id.trim() || null,
        latitude: location?.lat,
        longitude: location?.lng,
        lat: location?.lat,
        lng: location?.lng,
        status: 'new',
        user_id: user.id,
        user_email: user.email,
      };

      await reportService.createReport(payload);
      if (onCreated) {
        onCreated();
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de créer le signalement.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="report-modal-overlay" role="dialog" aria-modal="true">
      <div className="report-modal">
        <div className="report-modal-header">
          <div>
            <h2>Nouveau signalement</h2>
            <p className="report-modal-subtitle">Position: {coordsText}</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form className="report-form" onSubmit={handleSubmit}>
          <label className="form-label" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="glass-input"
            placeholder="Décrivez le problème rencontré"
            required
          />

          <label className="form-label" htmlFor="problem_type">
            Type de problème
          </label>
          <select
            id="problem_type"
            name="problem_type"
            value={formData.problem_type}
            onChange={handleChange}
            className="glass-input"
          >
            {problemTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          <div className="report-form-grid">
            <div>
              <label className="form-label" htmlFor="surface">
                Surface (m²)
              </label>
              <input
                id="surface"
                name="surface"
                type="number"
                min="0"
                step="0.1"
                value={formData.surface}
                onChange={handleChange}
                className="glass-input"
              />
            </div>
            <div>
              <label className="form-label" htmlFor="budget">
                Budget (Ar)
              </label>
              <input
                id="budget"
                name="budget"
                type="number"
                min="0"
                step="1000"
                value={formData.budget}
                onChange={handleChange}
                className="glass-input"
              />
            </div>
          </div>

          <label className="form-label" htmlFor="entreprise_id">
            Entreprise (optionnel)
          </label>
          <input
            id="entreprise_id"
            name="entreprise_id"
            type="text"
            value={formData.entreprise_id}
            onChange={handleChange}
            className="glass-input"
            placeholder="Nom ou identifiant de l'entreprise"
          />

          <div className="report-form-actions">
            <button type="button" className="glass-button" onClick={onClose} disabled={submitting}>
              Annuler
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Envoi...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportCreateModal;
