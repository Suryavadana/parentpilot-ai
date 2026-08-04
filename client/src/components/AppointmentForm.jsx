import { useEffect, useState } from 'react';
import axios from 'axios';
import '../App.css';

const emptyForm = {
  reason: '',
  scheduledAt: '',
  status: 'upcoming',
  notes: '',
  childId: '',
  doctorId: '',
};

const toDateTimeLocal = (value) => {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 16);
};

function AppointmentForm({ appointmentId, onSaved }) {
  const [formData, setFormData] = useState(emptyForm);
  const [children, setChildren] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(Boolean(appointmentId));
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

    const fetchDoctors = async () => {
      try {
        const response = await axios.get('/api/doctors');
        setDoctors(response.data);
      } catch (err) {
        // Doctor dropdown is optional; leave it empty if it fails to load.
      }
    };

    fetchChildren();
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (!appointmentId) {
      setFormData(emptyForm);
      setLoading(false);
      return;
    }

    const fetchAppointment = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await axios.get(`/api/appointments/${appointmentId}`);
        const appointment = response.data;

        setFormData({
          reason: appointment.reason || '',
          scheduledAt: toDateTimeLocal(appointment.scheduledAt),
          status: appointment.status || 'upcoming',
          notes: appointment.notes || '',
          childId: appointment.childId || '',
          doctorId: appointment.doctorId || '',
        });
      } catch (err) {
        setError('Unable to load appointment.');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [appointmentId]);

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

    if (!formData.reason.trim() || !formData.scheduledAt || !formData.childId) {
      setError('Reason, date and child are required.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        reason: formData.reason.trim(),
        scheduledAt: formData.scheduledAt,
        status: formData.status,
        notes: formData.notes.trim() || null,
        childId: formData.childId,
        doctorId: formData.doctorId || null,
      };

      if (appointmentId) {
        await axios.put(`/api/appointments/${appointmentId}`, payload);
        setSuccessMessage('Appointment updated successfully.');
      } else {
        await axios.post('/api/appointments', payload);
        setSuccessMessage('Appointment created successfully.');
        setFormData(emptyForm);
      }

      if (onSaved) {
        onSaved();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to save the appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="child-form-card">
      <h2>{appointmentId ? 'Edit appointment' : 'Add appointment'}</h2>

      {error ? <p className="form-message error">{error}</p> : null}
      {successMessage ? <p className="form-message success">{successMessage}</p> : null}

      {loading ? (
        <p className="form-loading">Loading appointment...</p>
      ) : (
        <form className="child-form" onSubmit={handleSubmit}>
          <label>
            Reason
            <input
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="e.g. Annual checkup"
              required
            />
          </label>

          <label>
            Date &amp; time
            <input
              name="scheduledAt"
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Status
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
            >
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>

          <label>
            Doctor
            <select
              name="doctorId"
              value={formData.doctorId}
              onChange={handleChange}
            >
              <option value="">No specific doctor</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </option>
              ))}
            </select>
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
            {submitting ? 'Saving...' : appointmentId ? 'Save changes' : 'Create appointment'}
          </button>
        </form>
      )}
    </section>
  );
}

export default AppointmentForm;
