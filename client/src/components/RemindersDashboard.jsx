import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useChild } from '../context/ChildContext';
import NoChildrenPrompt from './NoChildrenPrompt';
import '../App.css';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const TYPE_META = {
  homework: { icon: '📚', label: 'Homework' },
  fee: { icon: '💰', label: 'Fee' },
  appointment: { icon: '🩺', label: 'Appointment' },
  event: { icon: '📅', label: 'Event' },
  medication: { icon: '💊', label: 'Medication' },
};

const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const daysUntil = (date, today) => Math.round((startOfDay(date).getTime() - today.getTime()) / MS_PER_DAY);

const formatDate = (value) => new Date(value).toLocaleDateString(undefined, {
  year: 'numeric', month: 'short', day: 'numeric',
});

const formatDateTime = (value) => new Date(value).toLocaleString(undefined, {
  year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
});

const formatTime = (value) => new Date(value).toLocaleTimeString(undefined, {
  hour: 'numeric', minute: '2-digit',
});

const isMedicationActiveToday = (medication, today) => {
  const start = startOfDay(medication.startDate);
  if (start > today) return false;
  if (!medication.endDate) return true;
  return startOfDay(medication.endDate) >= today;
};

const urgencyClassName = (urgency) => (urgency === 'due_soon' ? 'due-soon' : urgency);

function RemindersDashboard() {
  const { hasChildren, loading: childrenLoading, selectedChildId } = useChild();
  const [homework, setHomework] = useState([]);
  const [fees, setFees] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [events, setEvents] = useState([]);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selectedChildId) {
      setHomework([]);
      setFees([]);
      setAppointments([]);
      setEvents([]);
      setMedications([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;

    const fetchAll = async () => {
      setLoading(true);

      try {
        const [homeworkRes, feesRes, appointmentsRes, eventsRes, medicationsRes] = await Promise.all([
          axios.get('/api/homework', { params: { childId: selectedChildId } }),
          axios.get('/api/fees', { params: { childId: selectedChildId } }),
          axios.get('/api/appointments', { params: { childId: selectedChildId } }),
          axios.get('/api/events', { params: { childId: selectedChildId } }),
          axios.get('/api/medications', { params: { childId: selectedChildId } }),
        ]);

        if (cancelled) return;

        setHomework(homeworkRes.data);
        setFees(feesRes.data);
        setAppointments(appointmentsRes.data);
        setEvents(eventsRes.data);
        setMedications(medicationsRes.data);
        setError('');
      } catch (err) {
        if (!cancelled) {
          setError('Unable to load reminders right now.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchAll();

    return () => {
      cancelled = true;
    };
  }, [selectedChildId]);

  if (!childrenLoading && !hasChildren) {
    return <NoChildrenPrompt />;
  }

  if (loading || childrenLoading) {
    return <div className="list-state">Loading reminders...</div>;
  }

  if (error) {
    return <div className="list-state error">{error}</div>;
  }

  const today = startOfDay(new Date());

  const homeworkItems = homework.map((item) => ({
    id: item.id,
    type: 'homework',
    urgency: item.urgency,
    sortDate: item.dueDate,
    title: item.title,
    meta: `Due ${formatDate(item.dueDate)}`,
    href: `/edit-homework/${item.id}`,
  }));

  const feeItems = fees.map((item) => ({
    id: item.id,
    type: 'fee',
    urgency: item.urgency,
    sortDate: item.dueDate,
    title: item.description,
    meta: `$${Number(item.amount).toFixed(2)} · Due ${formatDate(item.dueDate)}`,
    href: `/edit-fee/${item.id}`,
  }));

  const appointmentItems = appointments.map((item) => ({
    id: item.id,
    type: 'appointment',
    urgency: item.urgency,
    sortDate: item.scheduledAt,
    title: item.reason,
    meta: formatDateTime(item.scheduledAt),
    // No dedicated /edit-appointment/:id page exists yet — Appointments are
    // edited inline on their list page, so we link there instead.
    href: '/appointments',
  }));

  const urgencyItems = [...homeworkItems, ...feeItems, ...appointmentItems];
  const byDate = (a, b) => new Date(a.sortDate) - new Date(b.sortDate);

  const overdueItems = urgencyItems.filter((item) => item.urgency === 'overdue').sort(byDate);
  const dueSoonItems = urgencyItems.filter((item) => item.urgency === 'due_soon').sort(byDate);
  const upcomingItems = urgencyItems
    .filter((item) => item.urgency === 'upcoming' && daysUntil(new Date(item.sortDate), today) <= 7)
    .sort(byDate);

  const todayEventItems = events
    .filter((event) => startOfDay(event.startDate).getTime() === today.getTime())
    .map((event) => ({
      id: event.id,
      type: 'event',
      title: event.title,
      meta: event.allDay ? 'All day' : formatTime(event.startDate),
      href: `/edit-event/${event.id}`,
    }));

  const todayMedicationItems = medications
    .filter((medication) => isMedicationActiveToday(medication, today))
    .map((medication) => ({
      id: medication.id,
      type: 'medication',
      title: medication.name,
      meta: `${medication.dosage} · ${medication.frequency}`,
      // No dedicated /edit-medication/:id page exists yet — Medications are
      // edited inline on their list page, so we link there instead.
      href: '/medications',
    }));

  const todayItems = [...todayEventItems, ...todayMedicationItems];

  const totalCount = overdueItems.length + dueSoonItems.length
    + todayItems.length + upcomingItems.length;

  const renderSection = (title, items, sectionClassName) => {
    if (items.length === 0) return null;

    return (
      <section className="profile-section reminders-section">
        <h3>{title}</h3>
        <ul className="summary-list">
          {items.map((item) => (
            <li key={`${item.type}-${item.id}`}>
              <Link to={item.href} className={`summary-item reminder-item ${sectionClassName}`}>
                <span className="reminder-item-main">
                  <span className="reminder-type-badge">
                    {TYPE_META[item.type].icon} {TYPE_META[item.type].label}
                  </span>
                  <span className="summary-title">{item.title}</span>
                </span>
                <span className="summary-meta">{item.meta}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    );
  };

  if (totalCount === 0) {
    return (
      <section className="reminders-dashboard">
        <h2>Today</h2>
        <div className="list-state">All caught up! 🎉</div>
      </section>
    );
  }

  return (
    <section className="reminders-dashboard">
      <h2>Today</h2>
      <div className="profile-sections">
        {renderSection('Overdue', overdueItems, urgencyClassName('overdue'))}
        {renderSection('Due soon', dueSoonItems, urgencyClassName('due_soon'))}
        {renderSection('Today', todayItems, 'today')}
        {renderSection('Upcoming', upcomingItems, urgencyClassName('upcoming'))}
      </div>
    </section>
  );
}

export default RemindersDashboard;
