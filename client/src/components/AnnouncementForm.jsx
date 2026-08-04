import { useEffect, useState } from 'react';
import axios from 'axios';
import '../App.css';

const emptyForm = {
  title: '',
  startDate: '',
  location: '',
  childId: '',
};

const toDateTimeLocal = (value) => {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 16);
};

function AnnouncementForm({ announcementId, onSaved }) {
  const [formData, setFormData] = useState(emptyForm);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(Boolean(announcementId));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const response = await axios.get('/api/children');
        setChildren(response.data);
      } catch (err) {
        // Child dropdown is optional; leave it empty if it fails to load.
      }
    };

    fetchChildren();
  }, []);

  useEffect(() => {
    if (!announcementId) {
      setFormData(emptyForm);
      setLoading(false);
      return;
    }

    const fetchAnnouncement = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await axios.get(`/api/events/${announcementId}`);
        const announcement = response.data;

        setFormData({
          title: announcement.title || '',
          startDate: toDateTimeLocal(announcement.startDate),
          location: announcement.location || '',
          childId: announcement.childId || '',
        });
      } catch (err) {
        setError('Unable to load announcement.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncement();
  }, [announcementId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.title.trim() || !formData.startDate) {
      setError('Title and date are required.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        title: formData.title.trim(),
        category: 'announcement',
        startDate: formData.startDate,
        location: formData.location.trim(),
        childId: formData.childId || null,
      };

      if (announcementId) {
        await axios.put(`/api/events/${announcementId}`, payload);
        setSuccessMessage('Announcement updated successfully.');
      } else {
        await axios.post('/api/events', payload);
        setSuccessMessage('Announcement created successfully.');
        setFormData(emptyForm);
      }

      if (onSaved) {
        onSaved();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to save this announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="child-form-card">
      <h2>{announcementId ? 'Edit announcement' : 'Add announcement'}</h2>

      {error ? <p className="form-message error">{error}</p> : null}
      {successMessage ? <p className="form-message success">{successMessage}</p> : null}

      {loading ? (
        <p className="form-loading">Loading announcement...</p>
      ) : (
        <form className="child-form" onSubmit={handleSubmit}>
          <label>
            Title
            <input name="title" value={formData.title} onChange={handleChange} required />
          </label>

          <label>
            Date
            <input
              name="startDate"
              type="datetime-local"
              value={formData.startDate}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Location
            <input name="location" value={formData.location} onChange={handleChange} />
          </label>

          <label>
            Child
            <select name="childId" value={formData.childId} onChange={handleChange}>
              <option value="">Family-wide (all children)</option>
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.fullName}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : announcementId ? 'Save changes' : 'Create announcement'}
          </button>
        </form>
      )}
    </section>
  );
}

export default AnnouncementForm;
