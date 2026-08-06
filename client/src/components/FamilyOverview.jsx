import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useChild } from '../context/ChildContext';
import NoChildrenPrompt from './NoChildrenPrompt';
import '../App.css';

const MAX_ITEMS_PER_CARD = 4;
const AVATAR_COLOR_COUNT = 5;

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

const getInitials = (fullName) => (fullName || '')
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0].toUpperCase())
  .join('');

// A 403 means this role (e.g. caregiver) simply can't see this resource —
// treat it as "no data" rather than a card-level failure. Any other
// rejection (500, network error, etc.) is a real failure.
const isForbidden = (result) => result.status === 'rejected' && result.reason?.response?.status === 403;
const isRealFailure = (result) => result.status === 'rejected' && !isForbidden(result);
const dataOrEmpty = (result) => (result.status === 'fulfilled' ? result.value.data : []);

const fetchChildSummary = async (childId) => {
  const results = await Promise.allSettled([
    axios.get('/api/homework', { params: { childId } }),
    axios.get('/api/fees', { params: { childId } }),
    axios.get('/api/appointments', { params: { childId } }),
    axios.get('/api/events', { params: { childId } }),
    axios.get('/api/medications', { params: { childId } }),
  ]);

  if (results.some(isRealFailure)) {
    return { error: true };
  }

  const [homeworkResult, feesResult, appointmentsResult, eventsResult, medicationsResult] = results;

  const homework = dataOrEmpty(homeworkResult);
  const fees = dataOrEmpty(feesResult);
  const appointments = dataOrEmpty(appointmentsResult);
  const events = dataOrEmpty(eventsResult);
  const medications = dataOrEmpty(medicationsResult);

  const today = startOfDay(new Date());

  const homeworkItems = homework.map((item) => ({
    id: item.id,
    type: 'homework',
    urgency: item.urgency,
    sortDate: item.dueDate,
    title: item.title,
    meta: `Due ${formatDate(item.dueDate)}`,
  }));

  const feeItems = fees.map((item) => ({
    id: item.id,
    type: 'fee',
    urgency: item.urgency,
    sortDate: item.dueDate,
    title: item.description,
    meta: `$${Number(item.amount).toFixed(2)} · Due ${formatDate(item.dueDate)}`,
  }));

  const appointmentItems = appointments.map((item) => ({
    id: item.id,
    type: 'appointment',
    urgency: item.urgency,
    sortDate: item.scheduledAt,
    title: item.reason,
    meta: formatDateTime(item.scheduledAt),
  }));

  const urgencyItems = [...homeworkItems, ...feeItems, ...appointmentItems];
  const byDate = (a, b) => new Date(a.sortDate) - new Date(b.sortDate);

  const overdueItems = urgencyItems.filter((item) => item.urgency === 'overdue').sort(byDate);
  const dueSoonItems = urgencyItems.filter((item) => item.urgency === 'due_soon').sort(byDate);

  const todayEventItems = events
    .filter((event) => startOfDay(event.startDate).getTime() === today.getTime())
    .map((event) => ({
      id: event.id,
      type: 'event',
      title: event.title,
      meta: event.allDay ? 'All day' : formatTime(event.startDate),
    }));

  const todayMedicationItems = medications
    .filter((medication) => isMedicationActiveToday(medication, today))
    .map((medication) => ({
      id: medication.id,
      type: 'medication',
      title: medication.name,
      meta: `${medication.dosage} · ${medication.frequency}`,
    }));

  const todayItems = [...todayEventItems, ...todayMedicationItems];

  // Scannable overview, not a full replica of the per-child dashboard —
  // overdue items lead, then due-soon, then today, capped and truncated
  // with a link to the full /today view for anything beyond the cap.
  const combinedItems = [...overdueItems, ...dueSoonItems, ...todayItems];

  return {
    error: false,
    items: combinedItems.slice(0, MAX_ITEMS_PER_CARD),
    moreCount: Math.max(0, combinedItems.length - MAX_ITEMS_PER_CARD),
  };
};

function FamilyOverview() {
  const {
    children, hasChildren, loading: childrenLoading, setSelectedChildId,
  } = useChild();
  const [summaries, setSummaries] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (children.length === 0) {
      setSummaries({});
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all(children.map(async (child) => [child.id, await fetchChildSummary(child.id)]))
      .then((entries) => {
        if (cancelled) return;
        setSummaries(Object.fromEntries(entries));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [children]);

  if (!childrenLoading && !hasChildren) {
    return <NoChildrenPrompt />;
  }

  if (loading || childrenLoading) {
    return <div className="list-state">Loading family overview...</div>;
  }

  return (
    <section className="family-overview">
      <h2>Family Overview</h2>
      <div className="family-overview-grid">
        {children.map((child, index) => {
          const summary = summaries[child.id] || { error: false, items: [], moreCount: 0 };

          return (
            <div key={child.id} className="family-overview-card">
              <div className="family-overview-header">
                <span className={`family-overview-avatar avatar-color-${index % AVATAR_COLOR_COUNT}`}>
                  {getInitials(child.fullName) || '?'}
                </span>
                <h3 className="family-overview-name">{child.fullName}</h3>
              </div>

              {summary.error && (
                <p className="family-overview-empty">Unable to load this child&apos;s overview right now.</p>
              )}

              {!summary.error && summary.items.length === 0 && (
                <p className="family-overview-empty">All caught up! 🎉</p>
              )}

              {!summary.error && summary.items.length > 0 && (
                <ul className="summary-list">
                  {summary.items.map((item) => (
                    <li key={`${item.type}-${item.id}`}>
                      <span className={`summary-item reminder-item ${item.urgency ? item.urgency.replace('_', '-') : 'today'}`}>
                        <span className="reminder-item-main">
                          <span className="reminder-type-badge">
                            {TYPE_META[item.type].icon} {TYPE_META[item.type].label}
                          </span>
                          <span className="summary-title">{item.title}</span>
                        </span>
                        <span className="summary-meta">{item.meta}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {!summary.error && summary.moreCount > 0 && (
                <Link
                  to="/today"
                  className="family-overview-more"
                  onClick={() => setSelectedChildId(child.id)}
                >
                  +{summary.moreCount} more
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default FamilyOverview;
