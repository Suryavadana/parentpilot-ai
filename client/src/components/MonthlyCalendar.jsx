import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useChild } from '../context/ChildContext';
import NoChildrenPrompt from './NoChildrenPrompt';
import '../App.css';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const isSameDate = (a, b) => (
  a.getFullYear() === b.getFullYear()
  && a.getMonth() === b.getMonth()
  && a.getDate() === b.getDate()
);

const buildMonthGrid = (year, month) => {
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);

  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());

  const gridEnd = new Date(lastOfMonth);
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

  const days = [];
  const cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
};

const formatTime12h = (time) => {
  if (!time) return '';
  const [hoursStr, minutes] = time.split(':');
  const hours = Number(hoursStr);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${minutes} ${period}`;
};

const formatTime = (value) => new Date(value).toLocaleTimeString(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});

function MonthlyCalendar() {
  const { hasChildren, loading: childrenLoading, selectedChildId } = useChild();
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [schedule, setSchedule] = useState([]);
  const [homework, setHomework] = useState([]);
  const [fees, setFees] = useState([]);
  const [events, setEvents] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selectedChildId) {
      setSchedule([]);
      setHomework([]);
      setFees([]);
      setEvents([]);
      setAppointments([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;

    const fetchAll = async () => {
      setLoading(true);

      try {
        const [scheduleRes, homeworkRes, feesRes, eventsRes, appointmentsRes] = await Promise.all([
          axios.get('/api/daily-schedule', { params: { childId: selectedChildId } }),
          axios.get('/api/homework', { params: { childId: selectedChildId } }),
          axios.get('/api/fees', { params: { childId: selectedChildId } }),
          axios.get('/api/events', { params: { childId: selectedChildId } }),
          axios.get('/api/appointments', { params: { childId: selectedChildId } }),
        ]);

        if (cancelled) return;

        setSchedule(scheduleRes.data);
        setHomework(homeworkRes.data);
        setFees(feesRes.data);
        setEvents(eventsRes.data);
        setAppointments(appointmentsRes.data);
        setError('');
      } catch (err) {
        if (!cancelled) {
          setError('Unable to load calendar data right now.');
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

  const gridDays = useMemo(
    () => buildMonthGrid(viewDate.getFullYear(), viewDate.getMonth()),
    [viewDate],
  );

  const periodsForDay = (date) => schedule
    .filter((period) => period.dayOfWeek === date.getDay())
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const homeworkForDay = (date) => homework.filter((item) => isSameDate(new Date(item.dueDate), date));
  const feesForDay = (date) => fees.filter((item) => isSameDate(new Date(item.dueDate), date));
  const eventsForDay = (date) => events.filter((item) => isSameDate(new Date(item.startDate), date));
  const appointmentsForDay = (date) => appointments
    .filter((item) => isSameDate(new Date(item.scheduledAt), date));

  const goToPreviousMonth = () => {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  };

  if (!childrenLoading && !hasChildren) {
    return <NoChildrenPrompt />;
  }

  if (loading || childrenLoading) {
    return <div className="list-state">Loading calendar...</div>;
  }

  if (error) {
    return <div className="list-state error">{error}</div>;
  }

  const monthLabel = viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const today = new Date();

  const selectedPeriods = periodsForDay(selectedDate);
  const selectedHomework = homeworkForDay(selectedDate);
  const selectedFees = feesForDay(selectedDate);
  const selectedEvents = eventsForDay(selectedDate);
  const selectedAppointments = appointmentsForDay(selectedDate);

  return (
    <div className="monthly-calendar">
      <div className="calendar-nav">
        <button type="button" className="calendar-nav-button" onClick={goToPreviousMonth}>
          &lsaquo; Prev
        </button>
        <h2 className="calendar-nav-title">{monthLabel}</h2>
        <button type="button" className="calendar-nav-button" onClick={goToNextMonth}>
          Next &rsaquo;
        </button>
      </div>

      <div className="calendar-legend">
        <span className="calendar-legend-item"><span className="calendar-dot school" /> School</span>
        <span className="calendar-legend-item"><span className="calendar-dot homework" /> Homework</span>
        <span className="calendar-legend-item"><span className="calendar-dot fees" /> Fees</span>
        <span className="calendar-legend-item"><span className="calendar-dot events" /> Events</span>
        <span className="calendar-legend-item"><span className="calendar-dot appointments" /> Appointments</span>
      </div>

      <div className="calendar-grid">
        {DAY_LABELS.map((label) => (
          <div key={label} className="calendar-weekday">{label}</div>
        ))}

        {gridDays.map((date) => {
          const hasSchool = periodsForDay(date).length > 0;
          const hasHomework = homeworkForDay(date).length > 0;
          const hasFees = feesForDay(date).length > 0;
          const hasEvents = eventsForDay(date).length > 0;
          const hasAppointments = appointmentsForDay(date).length > 0;

          const cellClasses = [
            'calendar-day-cell',
            date.getMonth() !== viewDate.getMonth() ? 'outside-month' : '',
            isSameDate(date, today) ? 'today' : '',
            isSameDate(date, selectedDate) ? 'selected' : '',
          ].filter(Boolean).join(' ');

          return (
            <button
              type="button"
              key={date.toISOString()}
              className={cellClasses}
              onClick={() => setSelectedDate(date)}
            >
              <span className="calendar-day-number">{date.getDate()}</span>
              <span className="calendar-day-dots">
                {hasSchool && <span className="calendar-dot school" title="School" />}
                {hasHomework && <span className="calendar-dot homework" title="Homework" />}
                {hasFees && <span className="calendar-dot fees" title="Fees" />}
                {hasEvents && <span className="calendar-dot events" title="Events" />}
                {hasAppointments && (
                  <span className="calendar-dot appointments" title="Appointment" />
                )}
              </span>
            </button>
          );
        })}
      </div>

      <section className="calendar-detail">
        <h3>
          {selectedDate.toLocaleDateString(undefined, {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          })}
        </h3>

        <div className="profile-sections">
          <section className="profile-section">
            <h3>School</h3>
            {selectedPeriods.length === 0 ? (
              <p className="profile-empty">No periods today</p>
            ) : (
              <ul className="summary-list">
                {selectedPeriods.map((period) => (
                  <li key={period.id} className="summary-item category-school">
                    <span className="summary-title">{period.subject}</span>
                    <span className="summary-meta">
                      {formatTime12h(period.startTime)} – {formatTime12h(period.endTime)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="profile-section">
            <h3>Homework</h3>
            {selectedHomework.length === 0 ? (
              <p className="profile-empty">No homework due</p>
            ) : (
              <ul className="summary-list">
                {selectedHomework.map((item) => (
                  <li key={item.id} className="summary-item category-homework">
                    <span className="summary-title">{item.title}</span>
                    <span className="summary-meta">{item.subject} · {item.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="profile-section">
            <h3>Fees</h3>
            {selectedFees.length === 0 ? (
              <p className="profile-empty">No fees due</p>
            ) : (
              <ul className="summary-list">
                {selectedFees.map((item) => (
                  <li key={item.id} className="summary-item category-fees">
                    <span className="summary-title">{item.description}</span>
                    <span className="summary-meta">
                      ${Number(item.amount).toFixed(2)} · {item.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="profile-section">
            <h3>Events</h3>
            {selectedEvents.length === 0 ? (
              <p className="profile-empty">No events</p>
            ) : (
              <ul className="summary-list">
                {selectedEvents.map((item) => (
                  <li key={item.id} className="summary-item category-events">
                    <span className="summary-title">{item.title}</span>
                    <span className="summary-meta">
                      {item.allDay ? 'All day' : formatTime(item.startDate)}
                      {item.location ? ` · ${item.location}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="profile-section">
            <h3>Appointments</h3>
            {selectedAppointments.length === 0 ? (
              <p className="profile-empty">No appointments</p>
            ) : (
              <ul className="summary-list">
                {selectedAppointments.map((item) => (
                  <li key={item.id} className="summary-item category-appointments">
                    <span className="summary-title">{item.reason}</span>
                    <span className="summary-meta">
                      {formatTime(item.scheduledAt)}
                      {item.doctor?.name ? ` · ${item.doctor.name}` : ''}
                      {' · '}
                      {item.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

export default MonthlyCalendar;
