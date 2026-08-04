import { useEffect, useState } from 'react';
import axios from 'axios';
import { useChild } from '../context/ChildContext';
import NoChildrenPrompt from './NoChildrenPrompt';
import VaccinationForm from './VaccinationForm';
import '../App.css';

const formatDate = (value) => {
  if (!value) return '';

  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

function VaccinationsPanel() {
  const { hasChildren, loading: childrenLoading, selectedChildId } = useChild();
  const [vaccinations, setVaccinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingVaccinationId, setEditingVaccinationId] = useState(null);

  const fetchVaccinations = async () => {
    if (!selectedChildId) {
      setVaccinations([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await axios.get('/api/vaccinations', {
        params: { childId: selectedChildId },
      });
      setVaccinations(response.data);
      setError('');
    } catch (err) {
      setError('Unable to load vaccinations right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVaccinations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChildId]);

  const openAddForm = () => {
    setEditingVaccinationId(null);
    setShowForm(true);
  };

  const openEditForm = (id) => {
    setEditingVaccinationId(id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingVaccinationId(null);
  };

  const handleSaved = () => {
    closeForm();
    fetchVaccinations();
  };

  const handleDelete = async (id, vaccineName) => {
    const confirmed = window.confirm(`Delete "${vaccineName}"? This can't be undone.`);
    if (!confirmed) return;

    try {
      await axios.delete(`/api/vaccinations/${id}`);
      setVaccinations((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      alert('Unable to delete this vaccination right now.');
    }
  };

  if (!childrenLoading && !hasChildren) {
    return <NoChildrenPrompt />;
  }

  if (loading || childrenLoading) {
    return <div className="list-state">Loading vaccinations...</div>;
  }

  if (error) {
    return <div className="list-state error">{error}</div>;
  }

  const hasVaccinations = vaccinations.length > 0;

  return (
    <section className="events-list">
      <div className="section-header">
        <h2>Vaccinations</h2>
        {hasVaccinations && (
          <button
            type="button"
            className="toggle-form-button"
            onClick={showForm ? closeForm : openAddForm}
          >
            {showForm ? 'Cancel' : 'Add vaccination'}
          </button>
        )}
      </div>

      {(showForm || !hasVaccinations) && (
        <VaccinationForm vaccinationId={editingVaccinationId} onSaved={handleSaved} />
      )}

      {hasVaccinations ? (
        <div className="panel-list">
          {vaccinations.map((vaccination) => (
            <article key={vaccination.id} className="event-card">
              <h3>
                {vaccination.vaccineName}
                {vaccination.doseNumber ? ` · Dose ${vaccination.doseNumber}` : ''}
              </h3>
              <p><strong>Administered:</strong> {formatDate(vaccination.dateAdministered)}</p>
              {vaccination.nextDueDate && (
                <p><strong>Next due:</strong> {formatDate(vaccination.nextDueDate)}</p>
              )}
              {vaccination.administeredBy && (
                <p><strong>By:</strong> {vaccination.administeredBy}</p>
              )}
              {vaccination.notes && <p>{vaccination.notes}</p>}
              <span className="child-tag">{vaccination.child?.fullName}</span>
              <div className="card-actions">
                <button
                  type="button"
                  className="link-button"
                  onClick={() => openEditForm(vaccination.id)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="delete-button"
                  onClick={() => handleDelete(vaccination.id, vaccination.vaccineName)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="list-state">No vaccinations yet</div>
      )}
    </section>
  );
}

export default VaccinationsPanel;
