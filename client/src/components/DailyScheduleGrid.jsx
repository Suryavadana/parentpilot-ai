import { useEffect, useState } from 'react';
import axios from 'axios';
import { useChild } from '../context/ChildContext';
import NoChildrenPrompt from './NoChildrenPrompt';
import '../App.css';

const DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

const emptyForm = {
  dayOfWeek: '1',
  startTime: '',
  endTime: '',
  subject: '',
  location: '',
  notes: '',
};

const formatTime12h = (time) => {
  if (!time) return '';
  const [hoursStr, minutes] = time.split(':');
  const hours = Number(hoursStr);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${minutes} ${period}`;
};

function DailyScheduleGrid() {
  const { hasChildren, loading: childrenLoading, selectedChildId } = useChild();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formEntry, setFormEntry] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchSchedule = async () => {
    if (!selectedChildId) {
      setSchedule([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await axios.get('/api/daily-schedule', {
        params: { childId: selectedChildId },
      });
      setSchedule(response.data);
      setError('');
    } catch (err) {
      setError('Unable to load the schedule right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChildId]);

  const openAddForm = () => {
    setFormData(emptyForm);
    setFormError('');
    setFormEntry({});
  };

  const openEditForm = (entry) => {
    setFormData({
      dayOfWeek: String(entry.dayOfWeek),
      startTime: entry.startTime,
      endTime: entry.endTime,
      subject: entry.subject,
      location: entry.location || '',
      notes: entry.notes || '',
    });
    setFormError('');
    setFormEntry(entry);
  };

  const closeForm = () => {
    setFormEntry(null);
    setFormData(emptyForm);
    setFormError('');
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!formData.startTime || !formData.endTime || !formData.subject.trim()) {
      setFormError('Start time, end time and subject are required.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        dayOfWeek: Number(formData.dayOfWeek),
        startTime: formData.startTime,
        endTime: formData.endTime,
        subject: formData.subject.trim(),
        location: formData.location.trim(),
        notes: formData.notes.trim(),
        childId: selectedChildId,
      };

      if (formEntry?.id) {
        await axios.put(`/api/daily-schedule/${formEntry.id}`, payload);
      } else {
        await axios.post('/api/daily-schedule', payload);
      }

      closeForm();
      fetchSchedule();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Unable to save this period.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, subject) => {
    const confirmed = window.confirm(`Delete "${subject}"? This can't be undone.`);
    if (!confirmed) return;

    try {
      await axios.delete(`/api/daily-schedule/${id}`);
      setSchedule((current) => current.filter((entry) => entry.id !== id));
    } catch (err) {
      alert('Unable to delete this period right now.');
    }
  };

  if (!childrenLoading && !hasChildren) {
    return <NoChildrenPrompt />;
  }

  if (loading || childrenLoading) {
    return <div className="list-state">Loading schedule...</div>;
  }

  if (error) {
    return <div className="list-state error">{error}</div>;
  }

  const scheduleByDay = DAYS.map((day) => ({
    ...day,
    periods: schedule
      .filter((entry) => entry.dayOfWeek === day.value)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  }));

  return (
    <section className="daily-schedule">
      <div className="section-header">
        <h2>Weekly Schedule</h2>
        <button
          type="button"
          className="toggle-form-button"
          onClick={formEntry ? closeForm : openAddForm}
        >
          {formEntry ? 'Cancel' : 'Add period'}
        </button>
      </div>

      {formEntry && (
        <section className="child-form-card">
          <h2>{formEntry.id ? 'Edit period' : 'Add period'}</h2>

          {formError ? <p className="form-message error">{formError}</p> : null}

          <form className="child-form" onSubmit={handleSubmit}>
            <label>
              Day
              <select name="dayOfWeek" value={formData.dayOfWeek} onChange={handleChange} required>
                {DAYS.map((day) => (
                  <option key={day.value} value={day.value}>{day.label}</option>
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
                required
              />
            </label>

            <label>
              End time
              <input
                name="endTime"
                type="time"
                value={formData.endTime}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Subject
              <input name="subject" value={formData.subject} onChange={handleChange} required />
            </label>

            <label>
              Location
              <input name="location" value={formData.location} onChange={handleChange} />
            </label>

            <label>
              Notes
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} />
            </label>

            <button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : formEntry.id ? 'Save changes' : 'Create period'}
            </button>
          </form>
        </section>
      )}

      <div className="schedule-grid">
        {scheduleByDay.map((day) => (
          <div key={day.value} className="schedule-day">
            <h3 className="schedule-day-heading">{day.label}</h3>

            {day.periods.length === 0 ? (
              <p className="schedule-empty-day">No periods</p>
            ) : (
              day.periods.map((period) => (
                <div key={period.id} className="schedule-period">
                  <div className="schedule-period-subject">{period.subject}</div>
                  <div className="schedule-period-time">
                    {formatTime12h(period.startTime)} – {formatTime12h(period.endTime)}
                  </div>
                  {period.location && (
                    <div className="schedule-period-location">{period.location}</div>
                  )}
                  {period.notes && (
                    <div className="schedule-period-notes">{period.notes}</div>
                  )}
                  <div className="schedule-period-actions">
                    <button type="button" className="link-button" onClick={() => openEditForm(period)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => handleDelete(period.id, period.subject)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default DailyScheduleGrid;
