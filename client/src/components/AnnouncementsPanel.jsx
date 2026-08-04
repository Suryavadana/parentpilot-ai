import { useEffect, useState } from 'react';
import axios from 'axios';
import { useChild } from '../context/ChildContext';
import AnnouncementForm from './AnnouncementForm';
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

function AnnouncementsPanel() {
  const { selectedChildId } = useChild();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState(null);

  const fetchAnnouncements = async () => {
    setLoading(true);

    try {
      // Fetched once for the whole family (not filtered by childId server-side)
      // because the API's childId filter is an exact match — passing the
      // selected child would silently hide family-wide announcements. We
      // filter to "this child or family-wide" below instead.
      const response = await axios.get('/api/events', {
        params: { category: 'announcement' },
      });
      setAnnouncements(response.data);
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

  const visibleAnnouncements = selectedChildId
    ? announcements.filter((event) => !event.childId || event.childId === selectedChildId)
    : announcements;

  const openAddForm = () => {
    setEditingAnnouncementId(null);
    setShowForm(true);
  };

  const openEditForm = (id) => {
    setEditingAnnouncementId(id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingAnnouncementId(null);
  };

  const handleSaved = () => {
    closeForm();
    fetchAnnouncements();
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

  const hasAnnouncements = visibleAnnouncements.length > 0;

  return (
    <section className="events-list">
      <div className="section-header">
        <h2>Announcements</h2>
        {hasAnnouncements && (
          <button
            type="button"
            className="toggle-form-button"
            onClick={showForm ? closeForm : openAddForm}
          >
            {showForm ? 'Cancel' : 'Add announcement'}
          </button>
        )}
      </div>

      {(showForm || !hasAnnouncements) && (
        <AnnouncementForm announcementId={editingAnnouncementId} onSaved={handleSaved} />
      )}

      {hasAnnouncements ? (
        <div className="panel-list">
          {visibleAnnouncements.map((event) => (
            <article key={event.id} className="event-card">
              <h3>{event.title}</h3>
              <span className="category-badge">Announcement</span>
              <p>{formatEventDate(event)}</p>
              {event.location && <p><strong>Location:</strong> {event.location}</p>}
              <span className="child-tag">{event.child?.fullName || 'Family'}</span>
              <div className="card-actions">
                <button
                  type="button"
                  className="link-button"
                  onClick={() => openEditForm(event.id)}
                >
                  Edit
                </button>
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
