import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../App.css';

const emptyForm = {
  title: '',
  startDate: '',
  location: '',
};

const formatEventDate = (event) => {
  const startDate = new Date(event.startDate);

  if (event.allDay) {
    return startDate.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  return startDate.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

function AnnouncementsPanel() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get('/api/events');
      setAnnouncements(response.data.filter((event) => event.category === 'announcement'));
      setError('');
    } catch (err) {
      setError('Unable to load announcements right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!formData.title.trim() || !formData.startDate) {
      setFormError('Title and date are required.');
      return;
    }

    setSubmitting(true);

    try {
      await axios.post('/api/events', {
        title: formData.title.trim(),
        category: 'announcement',
        startDate: formData.startDate,
        location: formData.location.trim(),
      });
      setFormData(emptyForm);
      setShowAddForm(false);
      fetchAnnouncements();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Unable to save this announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    const confirmed = window.confirm(`Delete "${title}"? This can't be undone.`);
    if (!confirmed) return;

    try {
      await axios.delete(`/api/events/${id}`);
      setAnnouncements((current) => current.filter((event) => event.id !== id));
    } catch (err) {
      alert('Unable to delete this announcement right now.');
    }
  };

  if (loading) {
    return <div className="list-state">Loading announcements...</div>;
  }

  if (error) {
    return <div className="list-state error">{error}</div>;
  }

  const hasAnnouncements = announcements.length > 0;

  return (
    <section className="events-list">
      <div className="section-header">
        <h2>Announcements</h2>
        {hasAnnouncements && (
          <button
            type="button"
            className="toggle-form-button"
            onClick={() => setShowAddForm((current) => !current)}
          >
            {showAddForm ? 'Cancel' : 'Add announcement'}
          </button>
        )}
      </div>

      {(showAddForm || !hasAnnouncements) && (
        <section className="child-form-card">
          <h2>Add announcement</h2>

          {formError ? <p className="form-message error">{formError}</p> : null}

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

            <button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Create announcement'}
            </button>
          </form>
        </section>
      )}

      {hasAnnouncements ? (
        <div className="panel-list">
          {announcements.map((event) => (
            <article key={event.id} className="event-card">
              <h3>{event.title}</h3>
              <span className="category-badge">Announcement</span>
              <p>{formatEventDate(event)}</p>
              {event.location && <p><strong>Location:</strong> {event.location}</p>}
              <div className="card-actions">
                <Link to={`/edit-event/${event.id}`}>Edit</Link>
                <button
                  type="button"
                  className="delete-button"
                  onClick={() => handleDelete(event.id, event.title)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="list-state">No announcements yet</div>
      )}
    </section>
  );
}

export default AnnouncementsPanel;
