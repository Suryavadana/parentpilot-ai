import { useEffect, useState } from 'react';
import axios from 'axios';
import { useChild } from '../context/ChildContext';
import NoChildrenPrompt from './NoChildrenPrompt';
import MedicationForm from './MedicationForm';
import '../App.css';

const formatDate = (value) => {
  if (!value) return '';

  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateRange = (medication) => {
  const start = formatDate(medication.startDate);
  const end = medication.endDate ? formatDate(medication.endDate) : 'Ongoing';

  return `${start} – ${end}`;
};

function MedicationsPanel() {
  const { hasChildren, loading: childrenLoading, selectedChildId } = useChild();
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingMedicationId, setEditingMedicationId] = useState(null);

  const fetchMedications = async () => {
    if (!selectedChildId) {
      setMedications([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await axios.get('/api/medications', {
        params: { childId: selectedChildId },
      });
      setMedications(response.data);
      setError('');
    } catch (err) {
      setError('Unable to load medications right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChildId]);

  const openAddForm = () => {
    setEditingMedicationId(null);
    setShowForm(true);
  };

  const openEditForm = (id) => {
    setEditingMedicationId(id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingMedicationId(null);
  };

  const handleSaved = () => {
    closeForm();
    fetchMedications();
  };

  const handleDelete = async (id, name) => {
    const confirmed = window.confirm(`Delete "${name}"? This can't be undone.`);
    if (!confirmed) return;

    try {
      await axios.delete(`/api/medications/${id}`);
      setMedications((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      alert('Unable to delete this medication right now.');
    }
  };

  if (!childrenLoading && !hasChildren) {
    return <NoChildrenPrompt />;
  }

  if (loading || childrenLoading) {
    return <div className="list-state">Loading medications...</div>;
  }

  if (error) {
    return <div className="list-state error">{error}</div>;
  }

  const hasMedications = medications.length > 0;

  return (
    <section className="events-list">
      <div className="section-header">
        <h2>Medications</h2>
        {hasMedications && (
          <button
            type="button"
            className="toggle-form-button"
            onClick={showForm ? closeForm : openAddForm}
          >
            {showForm ? 'Cancel' : 'Add medication'}
          </button>
        )}
      </div>

      {(showForm || !hasMedications) && (
        <MedicationForm medicationId={editingMedicationId} onSaved={handleSaved} />
      )}

      {hasMedications ? (
        <div className="panel-list">
          {medications.map((medication) => (
            <article key={medication.id} className="event-card">
              <h3>{medication.name}</h3>
              <p>{medication.dosage} &middot; {medication.frequency}</p>
              <p>{formatDateRange(medication)}</p>
              {medication.notes && <p>{medication.notes}</p>}
              <span className="child-tag">{medication.child?.fullName}</span>
              <div className="card-actions">
                <button
                  type="button"
                  className="link-button"
                  onClick={() => openEditForm(medication.id)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="delete-button"
                  onClick={() => handleDelete(medication.id, medication.name)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="list-state">No medications yet</div>
      )}
    </section>
  );
}

export default MedicationsPanel;
