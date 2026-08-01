import { useEffect, useState } from 'react';
import axios from 'axios';
import '../App.css';

const emptyForm = {
  title: '',
  category: '',
  startDate: '',
  endDate: '',
  location: '',
  allDay: false,
  childId: '',
};

const toDateTimeLocal = (value) => {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 16);
};

function EventForm({ eventId, onSaved }) {
  const [formData, setFormData] = useState(emptyForm);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(Boolean(eventId));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const response = await axios.get('/api/children');
        setChildren(response.data);
      } catch (err) {
        // Children dropdown is optional; leave it empty if it fails to load.
      }
    };

    fetchChildren();
  }, []);

  useEffect(() => {
    if (!eventId) {
      setFormData(emptyForm);
      setLoading(false);
      return;
    }

    const fetchEvent = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await axios.get(`/api/events/${eventId}`);
        const event = response.data;

        setFormData({
          title: event.title || '',
          category: event.category || '',
          startDate: toDateTimeLocal(event.startDate),
          endDate: toDateTimeLocal(event.endDate),
          location: event.location || '',
          allDay: Boolean(event.allDay),
          childId: event.childId || '',
        });
      } catch (err) {
        setError('Unable to load event.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.title.trim() || !formData.category || !formData.startDate) {
      setError('Title, category and start date are required.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        title: formData.title.trim(),
        location: formData.location.trim(),
        childId: formData.childId || null,
        endDate: formData.endDate || null,
      };

      if (eventId) {
        await axios.put(`/api/events/${eventId}`, payload);
        setSuccessMessage('Event updated successfully.');
      } else {
        await axios.post('/api/events', payload);
        setSuccessMessage('Event created successfully.');
        setFormData(emptyForm);
      }

      if (onSaved) {
        onSaved();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to save the event.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="child-form-card">
      <h2>{eventId ? 'Edit event' : 'Add event'}</h2>

      {error ? <p className="form-message error">{error}</p> : null}
      {successMessage ? <p className="form-message success">{successMessage}</p> : null}

      {loading ? (
        <p className="form-loading">Loading event...</p>
      ) : (
        <form className="child-form" onSubmit={handleSubmit}>
          <label>
            Title
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Category
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select a category</option>
              <option value="school">School</option>
              <option value="activity">Activity</option>
              <option value="medical">Medical</option>
              <option value="family">Family</option>
            </select>
          </label>

          <label>
            Start date
            <input
              name="startDate"
              type="datetime-local"
              value={formData.startDate}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            End date
            <input
              name="endDate"
              type="datetime-local"
              value={formData.endDate}
              onChange={handleChange}
            />
          </label>

          <label>
            Location
            <input
              name="location"
              value={formData.location}
              onChange={handleChange}
            />
          </label>

          <label className="checkbox-label">
            <input
              name="allDay"
              type="checkbox"
              checked={formData.allDay}
              onChange={handleChange}
            />
            All day
          </label>

          <label>
            Child
            <select
              name="childId"
              value={formData.childId}
              onChange={handleChange}
            >
              <option value="">Family event</option>
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.fullName}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : eventId ? 'Save changes' : 'Create event'}
          </button>
        </form>
      )}
    </section>
  );
}

export default EventForm;
