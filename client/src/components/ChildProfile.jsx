import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return 'Unknown age';

  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return `${age} years`;
};

const urgencyClassName = (urgency) => {
  if (urgency === 'due_soon') return 'due-soon';
  if (urgency === 'paid') return 'done';
  return urgency;
};

const formatDate = (date) => new Date(date).toLocaleDateString(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const formatDateTime = (date) => new Date(date).toLocaleString(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const formatTime12h = (time) => {
  if (!time) return '';
  const [hoursStr, minutes] = time.split(':');
  const hours = Number(hoursStr);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${minutes} ${period}`;
};

function ChildProfile() {
  const { id } = useParams();
  const [child, setChild] = useState(null);
  const [homework, setHomework] = useState([]);
  const [fees, setFees] = useState([]);
  const [events, setEvents] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetchProfile = async () => {
      setLoading(true);
      setError('');

      try {
        const [childRes, homeworkRes, feesRes, eventsRes, scheduleRes] = await Promise.all([
          axios.get(`/api/children/${id}`),
          axios.get('/api/homework', { params: { childId: id } }),
          axios.get('/api/fees', { params: { childId: id } }),
          axios.get('/api/events', { params: { childId: id } }),
          axios.get('/api/daily-schedule', { params: { childId: id } }),
        ]);

        if (cancelled) return;

        setChild(childRes.data);
        setHomework(homeworkRes.data);
        setFees(feesRes.data);
        setEvents(eventsRes.data);
        setSchedule(scheduleRes.data);
      } catch (err) {
        if (!cancelled) {
          setError('Unable to load this child’s profile right now.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <div className="list-state">Loading profile...</div>;
  }

  if (error || !child) {
    return <div className="list-state error">{error || 'Child not found.'}</div>;
  }

  const upcomingEvents = events
    .filter((event) => new Date(event.startDate) >= new Date())
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, 5);

  const todayDayOfWeek = new Date().getDay();
  const todaysSchedule = schedule
    .filter((entry) => entry.dayOfWeek === todayDayOfWeek)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const topHomework = homework.slice(0, 5);
  const topFees = fees.slice(0, 5);

  return (
    <div className="child-profile">
      <section className="profile-header">
        <div className="profile-avatar">
          {child.profilePhotoUrl ? (
            <img src={child.profilePhotoUrl} alt={child.fullName} />
          ) : (
            <span>{child.fullName.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="profile-header-info">
          <h2>{child.fullName}</h2>
          <p className="profile-meta">
            {calculateAge(child.dateOfBirth)}
            {child.grade && ` · Grade ${child.grade}`}
            {child.school && ` · ${child.school}`}
          </p>
          {(child.bloodGroup || child.allergies || child.medicalConditions) && (
            <div className="profile-health">
              {child.bloodGroup && <span className="profile-tag">Blood: {child.bloodGroup}</span>}
              {child.allergies && <span className="profile-tag">Allergies: {child.allergies}</span>}
              {child.medicalConditions && (
                <span className="profile-tag">Medical: {child.medicalConditions}</span>
              )}
            </div>
          )}
          <Link to={`/edit/${child.id}`} className="link-button">Edit profile</Link>
          {' · '}
          <Link to={`/children/${child.id}/briefing`} className="link-button">Print briefing sheet</Link>
          {' · '}
          <Link to={`/children/${child.id}/vaccination-record`} className="link-button">
            Print vaccination record
          </Link>
        </div>
      </section>

      <div className="profile-sections">
        <section className="profile-section">
          <div className="section-header">
            <h3>Homework</h3>
            <Link to="/homework">See all</Link>
          </div>
          {topHomework.length === 0 ? (
            <p className="profile-empty">No homework yet</p>
          ) : (
            <ul className="summary-list">
              {topHomework.map((item) => (
                <li key={item.id} className={`summary-item ${urgencyClassName(item.urgency)}`}>
                  <span className="summary-title">{item.title}</span>
                  <span className="summary-meta">{formatDate(item.dueDate)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="profile-section">
          <div className="section-header">
            <h3>Fees</h3>
            <Link to="/fees">See all</Link>
          </div>
          {topFees.length === 0 ? (
            <p className="profile-empty">No fees yet</p>
          ) : (
            <ul className="summary-list">
              {topFees.map((item) => (
                <li key={item.id} className={`summary-item ${urgencyClassName(item.urgency)}`}>
                  <span className="summary-title">{item.description}</span>
                  <span className="summary-meta">
                    ${Number(item.amount).toFixed(2)}
                    {' · '}
                    {formatDate(item.dueDate)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="profile-section">
          <div className="section-header">
            <h3>Upcoming Events &amp; Activities</h3>
            <Link to="/events">See all</Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="profile-empty">Nothing upcoming</p>
          ) : (
            <ul className="summary-list">
              {upcomingEvents.map((event) => (
                <li key={event.id} className="summary-item">
                  <span className="summary-title">{event.title}</span>
                  <span className="summary-meta">{formatDateTime(event.startDate)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="profile-section">
          <div className="section-header">
            <h3>Today&apos;s Schedule</h3>
            <Link to="/calendar">See all</Link>
          </div>
          {todaysSchedule.length === 0 ? (
            <p className="profile-empty">No periods today</p>
          ) : (
            <ul className="summary-list">
              {todaysSchedule.map((period) => (
                <li key={period.id} className="summary-item">
                  <span className="summary-title">{period.subject}</span>
                  <span className="summary-meta">
                    {formatTime12h(period.startTime)} – {formatTime12h(period.endTime)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default ChildProfile;
