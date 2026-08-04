import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import EventForm from './EventForm';
import '../App.css';

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

function EventsList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('/api/events');
      setEvents(response.data);
    } catch (err) {
      setError('Unable to load events right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDelete = async (id, title) => {
    const confirmed = window.confirm(`Delete "${title}"? This can't be undone.`);
    if (!confirmed) return;

    try {
      await axios.delete(`/api/events/${id}`);
      setEvents((current) => current.filter((event) => event.id !== id));
    } catch (err) {
      alert('Unable to delete this event right now.');
    }
  };

  const handleEventAdded = () => {
    setShowAddForm(false);
    fetchEvents();
  };

  if (loading) {
    return <div className="list-state">Loading events...</div>;
  }

  if (error) {
    return <div className="list-state error">{error}</div>;
  }

  const hasEvents = events.length > 0;

  return (
    <section className="events-list">
      <div className="section-header">
        <h2>Events</h2>
        {hasEvents && (
          <button
            type="button"
            className="toggle-form-button"
            onClick={() => setShowAddForm((current) => !current)}
          >
            {showAddForm ? 'Cancel' : 'Add event'}
          </button>
        )}
      </div>

      {(showAddForm || !hasEvents) && <EventForm onSaved={handleEventAdded} />}

      {hasEvents ? (
        <div className="events-grid">
          {events.map((event) => (
            <article key={event.id} className="event-card">
              <h3>{event.title}</h3>
              <span className="category-badge">{event.category}</span>
              <p>{formatEventDate(event)}</p>
              {event.location && <p><strong>Location:</strong> {event.location}</p>}
              <span className="child-tag">{event.child?.fullName || 'Family event'}</span>
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
        <div className="no-events-prompt">
          <span className="no-events-icon" aria-hidden="true">📅</span>
          <h2>No events yet</h2>
          <p className="no-events-subtitle">
            Add your family&apos;s first event above to start keeping track of what&apos;s coming up.
          </p>
        </div>
      )}
    </section>
  );
}

export default EventsList;
