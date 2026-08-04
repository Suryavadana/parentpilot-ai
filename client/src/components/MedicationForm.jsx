import { useEffect, useState } from 'react';
import axios from 'axios';
import '../App.css';

const emptyForm = {
  name: '',
  dosage: '',
  frequency: '',
  startDate: '',
  endDate: '',
  notes: '',
  childId: '',
};

const toDateInput = (value) => {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
};

function MedicationForm({ medicationId, onSaved }) {
  const [formData, setFormData] = useState(emptyForm);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(Boolean(medicationId));
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
    if (!medicationId) {
      setFormData(emptyForm);
      setLoading(false);
      return;
    }

    const fetchMedication = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await axios.get(`/api/medications/${medicationId}`);
        const medication = response.data;

        setFormData({
          name: medication.name || '',
          dosage: medication.dosage || '',
          frequency: medication.frequency || '',
          startDate: toDateInput(medication.startDate),
          endDate: toDateInput(medication.endDate),
          notes: medication.notes || '',
          childId: medication.childId || '',
        });
      } catch (err) {
        setError('Unable to load medication.');
      } finally {
        setLoading(false);
      }
    };

    fetchMedication();
  }, [medicationId]);

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

    if (
      !formData.name.trim()
      || !formData.dosage.trim()
      || !formData.frequency.trim()
      || !formData.startDate
      || !formData.childId
    ) {
      setError('Name, dosage, frequency, start date and child are required.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        dosage: formData.dosage.trim(),
        frequency: formData.frequency.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        notes: formData.notes.trim() || null,
        childId: formData.childId,
      };

      if (medicationId) {
        await axios.put(`/api/medications/${medicationId}`, payload);
        setSuccessMessage('Medication updated successfully.');
      } else {
        await axios.post('/api/medications', payload);
        setSuccessMessage('Medication created successfully.');
        setFormData(emptyForm);
      }

      if (onSaved) {
        onSaved();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to save the medication.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="child-form-card">
      <h2>{medicationId ? 'Edit medication' : 'Add medication'}</h2>

      {error ? <p className="form-message error">{error}</p> : null}
      {successMessage ? <p className="form-message success">{successMessage}</p> : null}

      {loading ? (
        <p className="form-loading">Loading medication...</p>
      ) : (
        <form className="child-form" onSubmit={handleSubmit}>
          <label>
            Name
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Dosage
            <input
              name="dosage"
              value={formData.dosage}
              onChange={handleChange}
              placeholder="e.g. 5ml"
              required
            />
          </label>

          <label>
            Frequency
            <input
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              placeholder="e.g. Twice daily"
              required
            />
          </label>

          <label>
            Start date
            <input
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            End date
            <input
              name="endDate"
              type="date"
              value={formData.endDate}
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
            {submitting ? 'Saving...' : medicationId ? 'Save changes' : 'Create medication'}
          </button>
        </form>
      )}
    </section>
  );
}

export default MedicationForm;
