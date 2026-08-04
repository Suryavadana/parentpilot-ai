import { useEffect, useState } from 'react';
import axios from 'axios';
import '../App.css';

const emptyForm = {
  date: '',
  heightCm: '',
  weightKg: '',
  notes: '',
  childId: '',
};

const toDateInput = (value) => {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
};

function GrowthRecordForm({ growthRecordId, onSaved }) {
  const [formData, setFormData] = useState(emptyForm);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(Boolean(growthRecordId));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const response = await axios.get('/api/children');
        setChildren(response.data);
      } catch (err) {
        // Children dropdown is required to submit; leave it empty if it fails to load.
      }
    };

    fetchChildren();
  }, []);

  useEffect(() => {
    if (!growthRecordId) {
      setFormData(emptyForm);
      setLoading(false);
      return;
    }

    const fetchGrowthRecord = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await axios.get(`/api/growth-records/${growthRecordId}`);
        const growthRecord = response.data;

        setFormData({
          date: toDateInput(growthRecord.date),
          heightCm: growthRecord.heightCm !== null && growthRecord.heightCm !== undefined
            ? String(growthRecord.heightCm)
            : '',
          weightKg: growthRecord.weightKg !== null && growthRecord.weightKg !== undefined
            ? String(growthRecord.weightKg)
            : '',
          notes: growthRecord.notes || '',
          childId: growthRecord.childId || '',
        });
      } catch (err) {
        setError('Unable to load growth record.');
      } finally {
        setLoading(false);
      }
    };

    fetchGrowthRecord();
  }, [growthRecordId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.date || !formData.childId) {
      setError('Date and child are required.');
      return;
    }

    if (formData.heightCm === '' && formData.weightKg === '') {
      setError('At least one of height or weight is required.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        date: formData.date,
        heightCm: formData.heightCm === '' ? null : Number(formData.heightCm),
        weightKg: formData.weightKg === '' ? null : Number(formData.weightKg),
        notes: formData.notes.trim() || null,
        childId: formData.childId,
      };

      if (growthRecordId) {
        await axios.put(`/api/growth-records/${growthRecordId}`, payload);
        setSuccessMessage('Growth record updated successfully.');
      } else {
        await axios.post('/api/growth-records', payload);
        setSuccessMessage('Growth record created successfully.');
        setFormData(emptyForm);
      }

      if (onSaved) {
        onSaved();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to save the growth record.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="child-form-card">
      <h2>{growthRecordId ? 'Edit growth record' : 'Add growth record'}</h2>

      {error ? <p className="form-message error">{error}</p> : null}
      {successMessage ? <p className="form-message success">{successMessage}</p> : null}

      {loading ? (
        <p className="form-loading">Loading growth record...</p>
      ) : (
        <form className="child-form" onSubmit={handleSubmit}>
          <label>
            Date
            <input
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Height (cm)
            <input
              name="heightCm"
              type="number"
              step="0.1"
              min="0"
              value={formData.heightCm}
              onChange={handleChange}
            />
          </label>

          <label>
            Weight (kg)
            <input
              name="weightKg"
              type="number"
              step="0.1"
              min="0"
              value={formData.weightKg}
              onChange={handleChange}
            />
          </label>

          <label>
            Notes
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
            />
          </label>

          <label>
            Child
            <select
              name="childId"
              value={formData.childId}
              onChange={handleChange}
              required
            >
              <option value="">Select a child</option>
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.fullName}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : growthRecordId ? 'Save changes' : 'Create growth record'}
          </button>
        </form>
      )}
    </section>
  );
}

export default GrowthRecordForm;
