import { useEffect, useState } from 'react';
import axios from 'axios';
import '../App.css';

const emptyForm = {
  fullName: '',
  dateOfBirth: '',
  gender: '',
  school: '',
  grade: '',
  bloodGroup: '',
  allergies: '',
  medicalConditions: '',
};

function ChildForm({ childId, onSaved }) {
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(Boolean(childId));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!childId) {
      setFormData(emptyForm);
      setLoading(false);
      return;
    }

    const fetchChild = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await axios.get(`/api/children/${childId}`);
        const child = response.data;

        setFormData({
          fullName: child.fullName || '',
          dateOfBirth: child.dateOfBirth ? new Date(child.dateOfBirth).toISOString().slice(0, 10) : '',
          gender: child.gender || '',
          school: child.school || '',
          grade: child.grade || '',
          bloodGroup: child.bloodGroup || '',
          allergies: child.allergies || '',
          medicalConditions: child.medicalConditions || '',
        });
      } catch (err) {
        setError('Unable to load child profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchChild();
  }, [childId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.fullName.trim() || !formData.dateOfBirth) {
      setError('Full name and date of birth are required.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        fullName: formData.fullName.trim(),
      };

      if (childId) {
        await axios.put(`/api/children/${childId}`, payload);
        setSuccessMessage('Child profile updated successfully.');
      } else {
        await axios.post('/api/children', payload);
        setSuccessMessage('Child profile created successfully.');
        setFormData(emptyForm);
      }

      if (onSaved) {
        onSaved();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to save the child profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="child-form-card">
      <h2>{childId ? 'Edit child profile' : 'Add child profile'}</h2>

      {error ? <p className="form-message error">{error}</p> : null}
      {successMessage ? <p className="form-message success">{successMessage}</p> : null}

      {loading ? (
        <p className="form-loading">Loading profile...</p>
      ) : (
        <form className="child-form" onSubmit={handleSubmit}>
          <label>
            Full name
            <input
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Date of birth
            <input
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Gender
            <input
              name="gender"
              value={formData.gender}
              onChange={handleChange}
            />
          </label>

          <label>
            School
            <input
              name="school"
              value={formData.school}
              onChange={handleChange}
            />
          </label>

          <label>
            Grade
            <input
              name="grade"
              value={formData.grade}
              onChange={handleChange}
            />
          </label>

          <label>
            Blood group
            <input
              name="bloodGroup"
              value={formData.bloodGroup}
              onChange={handleChange}
            />
          </label>

          <label>
            Allergies
            <input
              name="allergies"
              value={formData.allergies}
              onChange={handleChange}
            />
          </label>

          <label>
            Medical conditions
            <textarea
              name="medicalConditions"
              value={formData.medicalConditions}
              onChange={handleChange}
              rows="3"
            />
          </label>

          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : childId ? 'Save changes' : 'Create child'}
          </button>
        </form>
      )}
    </section>
  );
}

export default ChildForm;
