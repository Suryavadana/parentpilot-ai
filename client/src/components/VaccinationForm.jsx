import { useEffect, useState } from 'react';
import axios from 'axios';
import '../App.css';

const emptyForm = {
  vaccineName: '',
  doseNumber: '',
  dateAdministered: '',
  nextDueDate: '',
  administeredBy: '',
  notes: '',
  childId: '',
};

const toDateInput = (value) => {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
};

function VaccinationForm({ vaccinationId, onSaved }) {
  const [formData, setFormData] = useState(emptyForm);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(Boolean(vaccinationId));
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
    if (!vaccinationId) {
      setFormData(emptyForm);
      setLoading(false);
      return;
    }

    const fetchVaccination = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await axios.get(`/api/vaccinations/${vaccinationId}`);
        const vaccination = response.data;

        setFormData({
          vaccineName: vaccination.vaccineName || '',
          doseNumber: vaccination.doseNumber !== null && vaccination.doseNumber !== undefined
            ? String(vaccination.doseNumber)
            : '',
          dateAdministered: toDateInput(vaccination.dateAdministered),
          nextDueDate: toDateInput(vaccination.nextDueDate),
          administeredBy: vaccination.administeredBy || '',
          notes: vaccination.notes || '',
          childId: vaccination.childId || '',
        });
      } catch (err) {
        setError('Unable to load vaccination.');
      } finally {
        setLoading(false);
      }
    };

    fetchVaccination();
  }, [vaccinationId]);

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

    if (!formData.vaccineName.trim() || !formData.dateAdministered || !formData.childId) {
      setError('Vaccine name, date administered and child are required.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        vaccineName: formData.vaccineName.trim(),
        doseNumber: formData.doseNumber === '' ? null : Number(formData.doseNumber),
        dateAdministered: formData.dateAdministered,
        nextDueDate: formData.nextDueDate || null,
        administeredBy: formData.administeredBy.trim() || null,
        notes: formData.notes.trim() || null,
        childId: formData.childId,
      };

      if (vaccinationId) {
        await axios.put(`/api/vaccinations/${vaccinationId}`, payload);
        setSuccessMessage('Vaccination updated successfully.');
      } else {
        await axios.post('/api/vaccinations', payload);
        setSuccessMessage('Vaccination created successfully.');
        setFormData(emptyForm);
      }

      if (onSaved) {
        onSaved();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to save the vaccination.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="child-form-card">
      <h2>{vaccinationId ? 'Edit vaccination' : 'Add vaccination'}</h2>

      {error ? <p className="form-message error">{error}</p> : null}
      {successMessage ? <p className="form-message success">{successMessage}</p> : null}

      {loading ? (
        <p className="form-loading">Loading vaccination...</p>
      ) : (
        <form className="child-form" onSubmit={handleSubmit}>
          <label>
            Vaccine name
            <input
              name="vaccineName"
              value={formData.vaccineName}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Dose number
            <input
              name="doseNumber"
              type="number"
              min="1"
              step="1"
              value={formData.doseNumber}
              onChange={handleChange}
            />
          </label>

          <label>
            Date administered
            <input
              name="dateAdministered"
              type="date"
              value={formData.dateAdministered}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Next due date
            <input
              name="nextDueDate"
              type="date"
              value={formData.nextDueDate}
              onChange={handleChange}
            />
          </label>

          <label>
            Administered by
            <input
              name="administeredBy"
              value={formData.administeredBy}
              onChange={handleChange}
              placeholder="e.g. Dr. Smith, City Clinic"
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
            {submitting ? 'Saving...' : vaccinationId ? 'Save changes' : 'Create vaccination'}
          </button>
        </form>
      )}
    </section>
  );
}

export default VaccinationForm;
