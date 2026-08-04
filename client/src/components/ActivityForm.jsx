import { useEffect, useState } from 'react';
import axios from 'axios';
import '../App.css';

const DAYS = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
];

const emptyForm = {
  name: '',
  activityType: '',
  coachName: '',
  venue: '',
  contactInfo: '',
  dayOfWeek: '',
  startTime: '',
  endTime: '',
  notes: '',
  childId: '',
};

function ActivityForm({ activityId, onSaved }) {
  const [formData, setFormData] = useState(emptyForm);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(Boolean(activityId));
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

    fetchChildren();
  }, []);

  useEffect(() => {
    if (!activityId) {
      setFormData(emptyForm);
      setLoading(false);
      return;
    }

    const fetchActivity = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await axios.get(`/api/activities/${activityId}`);
        const activity = response.data;

        setFormData({
          name: activity.name || '',
          activityType: activity.activityType || '',
          coachName: activity.coachName || '',
          venue: activity.venue || '',
          contactInfo: activity.contactInfo || '',
          dayOfWeek: activity.dayOfWeek === null || activity.dayOfWeek === undefined
            ? ''
            : String(activity.dayOfWeek),
          startTime: activity.startTime || '',
          endTime: activity.endTime || '',
          notes: activity.notes || '',
          childId: activity.childId || '',
        });
      } catch (err) {
        setError('Unable to load activity.');
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [activityId]);

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

    if (!formData.name.trim() || !formData.childId) {
      setError('Name and child are required.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        activityType: formData.activityType.trim() || null,
        coachName: formData.coachName.trim() || null,
        venue: formData.venue.trim() || null,
        contactInfo: formData.contactInfo.trim() || null,
        dayOfWeek: formData.dayOfWeek === '' ? null : Number(formData.dayOfWeek),
        startTime: formData.startTime || null,
        endTime: formData.endTime || null,
        notes: formData.notes.trim() || null,
        childId: formData.childId,
      };

      if (activityId) {
        await axios.put(`/api/activities/${activityId}`, payload);
        setSuccessMessage('Activity updated successfully.');
      } else {
        await axios.post('/api/activities', payload);
        setSuccessMessage('Activity created successfully.');
        setFormData(emptyForm);
      }

      if (onSaved) {
        onSaved();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to save the activity.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="child-form-card">
      <h2>{activityId ? 'Edit activity' : 'Add activity'}</h2>

      {error ? <p className="form-message error">{error}</p> : null}
      {successMessage ? <p className="form-message success">{successMessage}</p> : null}

      {loading ? (
        <p className="form-loading">Loading activity...</p>
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
            Activity type
            <input
              name="activityType"
              value={formData.activityType}
              onChange={handleChange}
              placeholder="Sport, Music, Art..."
            />
          </label>

          <label>
            Coach / instructor
            <input
              name="coachName"
              value={formData.coachName}
              onChange={handleChange}
            />
          </label>

          <label>
            Venue
            <input
              name="venue"
              value={formData.venue}
              onChange={handleChange}
            />
          </label>

          <label>
            Contact info
            <input
              name="contactInfo"
              value={formData.contactInfo}
              onChange={handleChange}
            />
          </label>

          <label>
            Day of week
            <select
              name="dayOfWeek"
              value={formData.dayOfWeek}
              onChange={handleChange}
            >
              <option value="">No fixed day</option>
              {DAYS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Start time
            <input
              name="startTime"
              type="time"
              value={formData.startTime}
              onChange={handleChange}
            />
          </label>

          <label>
            End time
            <input
              name="endTime"
              type="time"
              value={formData.endTime}
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
            {submitting ? 'Saving...' : activityId ? 'Save changes' : 'Create activity'}
          </button>
        </form>
      )}
    </section>
  );
}

export default ActivityForm;
