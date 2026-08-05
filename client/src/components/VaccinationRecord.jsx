import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

const formatDate = (value) => new Date(value).toLocaleDateString(undefined, {
  year: 'numeric', month: 'long', day: 'numeric',
});

function VaccinationRecord() {
  const { id } = useParams();
  const [child, setChild] = useState(null);
  const [vaccinations, setVaccinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetchRecord = async () => {
      setLoading(true);
      setError('');

      try {
        const [childRes, vaccinationsRes] = await Promise.all([
          axios.get(`/api/children/${id}`),
          axios.get('/api/vaccinations', { params: { childId: id } }),
        ]);

        if (cancelled) return;

        setChild(childRes.data);
        setVaccinations(vaccinationsRes.data);
      } catch (err) {
        if (!cancelled) {
          setError('Unable to load this vaccination record right now.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchRecord();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <div className="list-state">Loading vaccination record...</div>;
  }

  if (error || !child) {
    return <div className="list-state error">{error || 'Child not found.'}</div>;
  }

  const sortedVaccinations = [...vaccinations].sort(
    (a, b) => new Date(a.dateAdministered) - new Date(b.dateAdministered),
  );

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
          <div className="briefing-header-info">
            <p className="vaccination-record-label">Immunization Record</p>
            <h1>{child.fullName}</h1>
            <p className="briefing-meta">Date of birth: {formatDate(child.dateOfBirth)}</p>
          </div>
        </header>

        <section className="briefing-section">
          <h2>Vaccination History</h2>
          {sortedVaccinations.length === 0 ? (
            <p className="briefing-empty">No vaccination records on file.</p>
          ) : (
            <table className="briefing-table">
              <thead>
                <tr>
                  <th>Vaccine</th>
                  <th>Dose</th>
                  <th>Date Administered</th>
                  <th>Administered By</th>
                  <th>Next Due</th>
                </tr>
              </thead>
              <tbody>
                {sortedVaccinations.map((vaccination) => (
                  <tr key={vaccination.id}>
                    <td>{vaccination.vaccineName}</td>
                    <td>{vaccination.doseNumber || '—'}</td>
                    <td>{formatDate(vaccination.dateAdministered)}</td>
                    <td>{vaccination.administeredBy || '—'}</td>
                    <td>{vaccination.nextDueDate ? formatDate(vaccination.nextDueDate) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <p className="briefing-generated briefing-print-only">
          Generated from ParentPilotAI on {formatDate(new Date())}
        </p>
      </div>
    </div>
  );
}

export default VaccinationRecord;
