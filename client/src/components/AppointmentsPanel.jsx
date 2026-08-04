import { useEffect, useState } from 'react';
import axios from 'axios';
import { useChild } from '../context/ChildContext';
import NoChildrenPrompt from './NoChildrenPrompt';
import AppointmentForm from './AppointmentForm';
import '../App.css';

const formatScheduledAt = (value) => new Date(value).toLocaleString(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const URGENCY_LABELS = {
  overdue: 'Overdue',
  due_soon: 'Due soon',
  upcoming: 'Upcoming',
  completed: 'Completed',
};

const urgencyClassName = (urgency) => {
  if (urgency === 'due_soon') return 'due-soon';
  if (urgency === 'completed') return 'done';
  return urgency;
};

function AppointmentsPanel() {
  const { hasChildren, loading: childrenLoading, selectedChildId } = useChild();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState(null);

  const fetchAppointments = async () => {
    if (!selectedChildId) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await axios.get('/api/appointments', {
        params: { childId: selectedChildId },
      });
      setAppointments(response.data);
      setError('');
    } catch (err) {
      setError('Unable to load appointments right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChildId]);

  const openAddForm = () => {
    setEditingAppointmentId(null);
    setShowForm(true);
  };

  const openEditForm = (id) => {
    setEditingAppointmentId(id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingAppointmentId(null);
  };

  const handleSaved = () => {
    closeForm();
    fetchAppointments();
  };

  const handleDelete = async (id, reason) => {
    const confirmed = window.confirm(`Delete "${reason}"? This can't be undone.`);
    if (!confirmed) return;

    try {
      await axios.delete(`/api/appointments/${id}`);
      setAppointments((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      alert('Unable to delete this appointment right now.');
    }
  };

  if (!childrenLoading && !hasChildren) {
    return <NoChildrenPrompt />;
  }

  if (loading || childrenLoading) {
    return <div className="list-state">Loading appointments...</div>;
  }

  if (error) {
    return <div className="list-state error">{error}</div>;
  }

  const hasAppointments = appointments.length > 0;

  return (
    <section className="homework-list">
      <div className="section-header">
        <h2>Appointments</h2>
        {hasAppointments && (
          <button
            type="button"
            className="toggle-form-button"
            onClick={showForm ? closeForm : openAddForm}
          >
            {showForm ? 'Cancel' : 'Add appointment'}
          </button>
        )}
      </div>

      {(showForm || !hasAppointments) && (
        <AppointmentForm appointmentId={editingAppointmentId} onSaved={handleSaved} />
      )}

      {hasAppointments ? (
        <div className="homework-grid">
          {appointments.map((appointment) => (
            <article
              key={appointment.id}
              className={`homework-card ${urgencyClassName(appointment.urgency)}`}
            >
              <span className={`urgency-badge ${urgencyClassName(appointment.urgency)}`}>
                {URGENCY_LABELS[appointment.urgency] || appointment.urgency}
              </span>
              <h3>{appointment.reason}</h3>
              <p><strong>When:</strong> {formatScheduledAt(appointment.scheduledAt)}</p>
              {appointment.doctor?.name && (
                <p><strong>Doctor:</strong> {appointment.doctor.name}</p>
              )}
              <p><strong>Status:</strong> {appointment.status}</p>
              {appointment.notes && <p>{appointment.notes}</p>}
              <span className="child-tag">{appointment.child?.fullName}</span>
              <div className="card-actions">
                <button
                  type="button"
                  className="link-button"
                  onClick={() => openEditForm(appointment.id)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="delete-button"
                  onClick={() => handleDelete(appointment.id, appointment.reason)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="list-state">No appointments yet</div>
      )}
    </section>
  );
}

export default AppointmentsPanel;
