import { useEffect, useState } from 'react';
import axios from 'axios';
import { useChild } from '../context/ChildContext';
import NoChildrenPrompt from './NoChildrenPrompt';
import ActivityForm from './ActivityForm';
import '../App.css';

const DAY_LABELS = [
  'Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays',
];

const formatSchedule = (activity) => {
  const hasDay = activity.dayOfWeek !== null && activity.dayOfWeek !== undefined;
  const hasTime = Boolean(activity.startTime && activity.endTime);
  const dayLabel = hasDay ? DAY_LABELS[activity.dayOfWeek] : '';
  const timeLabel = hasTime ? `${activity.startTime}-${activity.endTime}` : '';

  return [dayLabel, timeLabel].filter(Boolean).join(' ');
};

function ActivitiesPanel() {
  const { hasChildren, loading: childrenLoading, selectedChildId } = useChild();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState(null);

  const fetchActivities = async () => {
    if (!selectedChildId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await axios.get('/api/activities', {
        params: { childId: selectedChildId },
      });
      setActivities(response.data);
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

  const openAddForm = () => {
    setEditingActivityId(null);
    setShowForm(true);
  };

  const openEditForm = (id) => {
    setEditingActivityId(id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingActivityId(null);
  };

  const handleSaved = () => {
    closeForm();
    fetchActivities();
  };

  const handleDelete = async (id, name) => {
    const confirmed = window.confirm(`Delete "${name}"? This can't be undone.`);
    if (!confirmed) return;

    try {
      await axios.delete(`/api/activities/${id}`);
      setActivities((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      alert('Unable to delete this activity right now.');
    }
  };

  if (!childrenLoading && !hasChildren) {
    return <NoChildrenPrompt />;
  }

  if (loading || childrenLoading) {
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
            onClick={showForm ? closeForm : openAddForm}
          >
            {showForm ? 'Cancel' : 'Add activity'}
          </button>
        )}
      </div>

      {(showForm || !hasActivities) && (
        <ActivityForm activityId={editingActivityId} onSaved={handleSaved} />
      )}

      {hasActivities ? (
        <div className="panel-list">
          {activities.map((activity) => (
            <article key={activity.id} className="event-card">
              <h3>{activity.name}</h3>
              {activity.activityType && (
                <span className="category-badge">{activity.activityType}</span>
              )}
              {(activity.coachName || activity.venue || activity.contactInfo) && (
                <p>
                  {[activity.coachName, activity.venue, activity.contactInfo]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}
              {formatSchedule(activity) && <p>{formatSchedule(activity)}</p>}
              {activity.notes && <p>{activity.notes}</p>}
              <span className="child-tag">{activity.child?.fullName}</span>
              <div className="card-actions">
                <button
                  type="button"
                  className="link-button"
                  onClick={() => openEditForm(activity.id)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="delete-button"
                  onClick={() => handleDelete(activity.id, activity.name)}
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
