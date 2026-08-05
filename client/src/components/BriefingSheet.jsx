import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

const DAY_LABELS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;

  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
};

const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const isMedicationActiveToday = (medication, today) => {
  const start = startOfDay(medication.startDate);
  if (start > today) return false;
  if (!medication.endDate) return true;
  return startOfDay(medication.endDate) >= today;
};

const formatTime12h = (time) => {
  if (!time) return '';
  const [hoursStr, minutes] = time.split(':');
  const hours = Number(hoursStr);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${minutes} ${period}`;
};

const formatGeneratedAt = (value) => value.toLocaleString(undefined, {
  year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
});

function BriefingSheet() {
  const { id } = useParams();
  const [child, setChild] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [medications, setMedications] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetchBriefing = async () => {
      setLoading(true);
      setError('');

      try {
        const [childRes, scheduleRes, medicationsRes, doctorsRes] = await Promise.all([
          axios.get(`/api/children/${id}`),
          axios.get('/api/daily-schedule', { params: { childId: id } }),
          axios.get('/api/medications', { params: { childId: id } }),
          axios.get('/api/doctors', { params: { childId: id } }),
        ]);

        if (cancelled) return;

        setChild(childRes.data);
        setSchedule(scheduleRes.data);
        setMedications(medicationsRes.data);
        setDoctors(doctorsRes.data);
      } catch (err) {
        if (!cancelled) {
          setError('Unable to load this briefing sheet right now.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchBriefing();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <div className="list-state">Loading briefing sheet...</div>;
  }

  if (error || !child) {
    return <div className="list-state error">{error || 'Child not found.'}</div>;
  }

  const today = startOfDay(new Date());
  const todayDayOfWeek = new Date().getDay();

  const todaysSchedule = schedule
    .filter((entry) => entry.dayOfWeek === todayDayOfWeek)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const activeMedications = medications
    .filter((medication) => isMedicationActiveToday(medication, today))
    .sort((a, b) => a.name.localeCompare(b.name));

  const age = calculateAge(child.dateOfBirth);
  const hasEmergencyInfo = Boolean(child.bloodGroup || child.allergies || child.medicalConditions);

  return (
    <div className="briefing-sheet">
      <div className="briefing-toolbar">
        <Link to={`/children/${id}`} className="briefing-back-link">&larr; Back to profile</Link>
        <button type="button" className="briefing-print-button" onClick={() => window.print()}>
          Print
        </button>
      </div>

      <div className="briefing-page">
        <header className="briefing-header">
          <div className="briefing-avatar">
            {child.profilePhotoUrl ? (
              <img src={child.profilePhotoUrl} alt={child.fullName} />
            ) : (
              <span>{child.fullName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="briefing-header-info">
            <h1>{child.fullName}</h1>
            <p className="briefing-meta">
              {age !== null ? `${age} years old` : 'Age unknown'}
              {child.grade && ` · Grade ${child.grade}`}
              {child.school && ` · ${child.school}`}
            </p>
          </div>
          <p className="briefing-generated">Prepared {formatGeneratedAt(new Date())}</p>
        </header>

        {hasEmergencyInfo && (
          <section className="briefing-emergency">
            <h2>⚠ Emergency &amp; Allergy Info</h2>
            <div className="briefing-emergency-grid">
              {child.bloodGroup && (
                <div><strong>Blood group:</strong> {child.bloodGroup}</div>
              )}
              {child.allergies && (
                <div><strong>Allergies:</strong> {child.allergies}</div>
              )}
              {child.medicalConditions && (
                <div><strong>Medical conditions:</strong> {child.medicalConditions}</div>
              )}
            </div>
          </section>
        )}

        <section className="briefing-section">
          <h2>Today&apos;s Schedule — {DAY_LABELS[todayDayOfWeek]}</h2>
          {todaysSchedule.length === 0 ? (
            <p className="briefing-empty">No scheduled periods today.</p>
          ) : (
            <table className="briefing-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Subject</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {todaysSchedule.map((period) => (
                  <tr key={period.id}>
                    <td>{formatTime12h(period.startTime)} – {formatTime12h(period.endTime)}</td>
                    <td>{period.subject}</td>
                    <td>{period.location || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="briefing-section">
          <h2>Current Medications</h2>
          {activeMedications.length === 0 ? (
            <p className="briefing-empty">No active medications.</p>
          ) : (
            <table className="briefing-table">
              <thead>
                <tr>
                  <th>Medication</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {activeMedications.map((medication) => (
                  <tr key={medication.id}>
                    <td>{medication.name}</td>
                    <td>{medication.dosage}</td>
                    <td>{medication.frequency}</td>
                    <td>{medication.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="briefing-section">
          <h2>Doctor Contacts</h2>
          {doctors.length === 0 ? (
            <p className="briefing-empty">No doctors on file.</p>
          ) : (
            <table className="briefing-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Specialty</th>
                  <th>Phone</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doctor) => (
                  <tr key={doctor.id}>
                    <td>
                      {doctor.name}
                      {!doctor.childId && <span className="briefing-family-tag">Family</span>}
                    </td>
                    <td>{doctor.specialty || '—'}</td>
                    <td>{doctor.phone || '—'}</td>
                    <td>{doctor.email || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}

export default BriefingSheet;
