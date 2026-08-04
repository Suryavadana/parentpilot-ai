import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useChild } from '../context/ChildContext';
import '../App.css';

const emptyForm = {
  title: '',
  startDate: '',
  location: '',
  childId: '',
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

function ActivitiesPanel() {
  const { children, selectedChildId } = useChild();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ ...emptyForm, childId: selectedChildId || '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchActivities = async () => {
    if (!selectedChildId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await axios.get('/api/events', {
        params: { childId: selectedChildId },
      });
      setActivities(response.data.filter((event) => event.category === 'activity'));
      setError('');
    } catch (err) {
      setError('Unable to load activities right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChildId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const openAddForm = () => {
    setFormData({ ...emptyForm, childId: selectedChildId || '' });
    setFormError('');
    setShowAddForm(true);
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
        category: 'activity',
        startDate: formData.startDate,
        location: formData.location.trim(),
        childId: formData.childId || null,
      });
      setFormData({ ...emptyForm, childId: selectedChildId || '' });
      setShowAddForm(false);
      fetchActivities();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Unable to save this activity.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    const confirmed = window.confirm(`Delete "${title}"? This can't be undone.`);
    if (!confirmed) return;

    try {
      await axios.delete(`/api/events/${id}`);
      setActivities((current) => current.filter((event) => event.id !== id));
    } catch (err) {
      alert('Unable to delete this activity right now.');
    }
  };

  if (loading) {
    return <div className="list-state">Loading activities...</div>;
  }

  if (error) {
    return <div className="list-state error">{error}</div>;
  }

  const hasActivities = activities.length > 0;

  return (
    <section className="events-list">
      <div className="section-header">
        <h2>Activities</h2>
        {hasActivities && (
          <button
            type="button"
            className="toggle-form-button"
            onClick={() => (showAddForm ? setShowAddForm(false) : openAddForm())}
          >
            {showAddForm ? 'Cancel' : 'Add activity'}
          </button>
        )}
      </div>

      {(showAddForm || !hasActivities) && (
        <section className="child-form-card">
          <h2>Add activity</h2>

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

            <label>
              Child
              <select name="childId" value={formData.childId} onChange={handleChange}>
                <option value="">Unassigned</option>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.fullName}
                  </option>
                ))}
              </select>
            </label>

            <button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Create activity'}
            </button>
          </form>
        </section>
      )}

      {hasActivities ? (
        <div className="panel-list">
          {activities.map((event) => (
            <article key={event.id} className="event-card">
              <h3>{event.title}</h3>
              <span className="category-badge">Activity</span>
              <p>{formatEventDate(event)}</p>
              {event.location && <p><strong>Location:</strong> {event.location}</p>}
              <span className="child-tag">{event.child?.fullName || 'Unassigned'}</span>
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
        <div className="list-state">No activities yet</div>
      )}
    </section>
  );
}

export default ActivitiesPanel;
