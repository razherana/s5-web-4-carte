import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
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
    date_signalement: '',
    surface: '',
    niveau: '1',
    prix_par_m2: '',
    entreprise_name: '',
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
        date_signalement: '',
        surface: '',
        niveau: '1',
        prix_par_m2: '',
        entreprise_name: '',
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

    if (!formData.entreprise_name.trim()) {
      setError("Le nom de l'entreprise est obligatoire.");
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        description: formData.description.trim(),
        problem_type: formData.problem_type,
        date_signalement: formData.date_signalement || null,
        surface: formData.surface ? Number(formData.surface) : null,
        niveau: formData.niveau ? Number(formData.niveau) : 1,
        prix_par_m2: formData.prix_par_m2 ? Number(formData.prix_par_m2) : null,
        entreprise_name: formData.entreprise_name.trim(),
        latitude: location?.lat,
        longitude: location?.lng,
        lat: location?.lat,
        lng: location?.lng,
        status: 'pending',
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
            <X size={18} />
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

          <label className="form-label" htmlFor="date_signalement">
            Date du signalement
          </label>
          <input
            id="date_signalement"
            name="date_signalement"
            type="date"
            value={formData.date_signalement}
            onChange={handleChange}
            className="glass-input"
            required
          />

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
              <label className="form-label" htmlFor="niveau">
                Niveau (1-10)
              </label>
              <input
                id="niveau"
                name="niveau"
                type="number"
                min="1"
                max="10"
                step="1"
                value={formData.niveau}
                onChange={handleChange}
                className="glass-input"
              />
            </div>
            <div>
              <label className="form-label" htmlFor="prix_par_m2">
                Prix par m² (Ar)
              </label>
              <input
                id="prix_par_m2"
                name="prix_par_m2"
                type="number"
                min="0"
                step="0.01"
                value={formData.prix_par_m2}
                onChange={handleChange}
                className="glass-input"
              />
            </div>
          </div>

          {/* Budget display */}
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

          <label className="form-label" htmlFor="entreprise_name">
            Entreprise
          </label>
          <input
            id="entreprise_name"
            name="entreprise_name"
            type="text"
            value={formData.entreprise_name}
            onChange={handleChange}
            className="glass-input"
            placeholder="Nom de l'entreprise"
            required
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
