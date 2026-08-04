import { useEffect, useState } from 'react';
import axios from 'axios';
import '../App.css';

const emptyForm = {
  name: '',
  specialty: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  childId: '',
};

function DoctorForm({ doctorId, onSaved }) {
  const [formData, setFormData] = useState(emptyForm);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(Boolean(doctorId));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const response = await axios.get('/api/children');
        setChildren(response.data);
      } catch (err) {
        // Child dropdown is optional here; leave it empty if it fails to load.
      }
    };

    fetchChildren();
  }, []);

  useEffect(() => {
    if (!doctorId) {
      setFormData(emptyForm);
      setLoading(false);
      return;
    }

    const fetchDoctor = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await axios.get(`/api/doctors/${doctorId}`);
        const doctor = response.data;

        setFormData({
          name: doctor.name || '',
          specialty: doctor.specialty || '',
          phone: doctor.phone || '',
          email: doctor.email || '',
          address: doctor.address || '',
          notes: doctor.notes || '',
          childId: doctor.childId || '',
        });
      } catch (err) {
        setError('Unable to load doctor.');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctor();
  }, [doctorId]);

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

    if (!formData.name.trim()) {
      setError('Name is required.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        specialty: formData.specialty.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
        notes: formData.notes.trim() || null,
        childId: formData.childId || null,
      };

      if (doctorId) {
        await axios.put(`/api/doctors/${doctorId}`, payload);
        setSuccessMessage('Doctor updated successfully.');
      } else {
        await axios.post('/api/doctors', payload);
        setSuccessMessage('Doctor created successfully.');
        setFormData(emptyForm);
      }

      if (onSaved) {
        onSaved();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to save the doctor.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="child-form-card">
      <h2>{doctorId ? 'Edit doctor' : 'Add doctor'}</h2>

      {error ? <p className="form-message error">{error}</p> : null}
      {successMessage ? <p className="form-message success">{successMessage}</p> : null}

      {loading ? (
        <p className="form-loading">Loading doctor...</p>
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
            Specialty
            <input
              name="specialty"
              value={formData.specialty}
              onChange={handleChange}
              placeholder="Pediatrician, Dentist, Cardiologist..."
            />
          </label>

          <label>
            Phone
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </label>

          <label>
            Email
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </label>

          <label>
            Address
            <input
              name="address"
              value={formData.address}
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
            >
              <option value="">Family-wide (any child)</option>
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.fullName}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : doctorId ? 'Save changes' : 'Create doctor'}
          </button>
        </form>
      )}
    </section>
  );
}

export default DoctorForm;
