import { useEffect, useState } from 'react';
import axios from 'axios';
import { useChild } from '../context/ChildContext';
import NoChildrenPrompt from './NoChildrenPrompt';
import GrowthRecordForm from './GrowthRecordForm';
import '../App.css';

const formatDate = (value) => {
  if (!value) return '';

  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDelta = (current, previous, unit) => {
  if (current === null || current === undefined) return null;
  if (previous === null || previous === undefined) return null;

  const delta = Math.round((current - previous) * 10) / 10;
  if (delta === 0) return null;

  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta}${unit} since last record`;
};

function GrowthRecordsPanel() {
  const { hasChildren, loading: childrenLoading, selectedChildId } = useChild();
  const [growthRecords, setGrowthRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingGrowthRecordId, setEditingGrowthRecordId] = useState(null);

  const fetchGrowthRecords = async () => {
    if (!selectedChildId) {
      setGrowthRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await axios.get('/api/growth-records', {
        params: { childId: selectedChildId },
      });
      setGrowthRecords(response.data);
      setError('');
    } catch (err) {
      setError('Unable to load growth records right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrowthRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChildId]);

  const openAddForm = () => {
    setEditingGrowthRecordId(null);
    setShowForm(true);
  };

  const openEditForm = (id) => {
    setEditingGrowthRecordId(id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingGrowthRecordId(null);
  };

  const handleSaved = () => {
    closeForm();
    fetchGrowthRecords();
  };

  const handleDelete = async (id, date) => {
    const confirmed = window.confirm(`Delete the record from "${formatDate(date)}"? This can't be undone.`);
    if (!confirmed) return;

    try {
      await axios.delete(`/api/growth-records/${id}`);
      setGrowthRecords((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      alert('Unable to delete this growth record right now.');
    }
  };

  if (!childrenLoading && !hasChildren) {
    return <NoChildrenPrompt />;
  }

  if (loading || childrenLoading) {
    return <div className="list-state">Loading growth records...</div>;
  }

  if (error) {
    return <div className="list-state error">{error}</div>;
  }

  const hasGrowthRecords = growthRecords.length > 0;

  return (
    <section className="events-list">
      <div className="section-header">
        <h2>Growth Records</h2>
        {hasGrowthRecords && (
          <button
            type="button"
            className="toggle-form-button"
            onClick={showForm ? closeForm : openAddForm}
          >
            {showForm ? 'Cancel' : 'Add growth record'}
          </button>
        )}
      </div>

      {(showForm || !hasGrowthRecords) && (
        <GrowthRecordForm growthRecordId={editingGrowthRecordId} onSaved={handleSaved} />
      )}

      {hasGrowthRecords ? (
        <div className="panel-list">
          {growthRecords.map((record, index) => {
            const previous = growthRecords[index + 1];
            const heightDelta = previous
              ? formatDelta(record.heightCm, previous.heightCm, 'cm')
              : null;
            const weightDelta = previous
              ? formatDelta(record.weightKg, previous.weightKg, 'kg')
              : null;

            return (
              <article key={record.id} className="event-card">
                <h3>{formatDate(record.date)}</h3>
                {record.heightCm !== null && record.heightCm !== undefined && (
                  <p>
                    <strong>Height:</strong> {record.heightCm} cm
                    {heightDelta ? ` (${heightDelta})` : ''}
                  </p>
                )}
                {record.weightKg !== null && record.weightKg !== undefined && (
                  <p>
                    <strong>Weight:</strong> {record.weightKg} kg
                    {weightDelta ? ` (${weightDelta})` : ''}
                  </p>
                )}
                {record.notes && <p>{record.notes}</p>}
                <span className="child-tag">{record.child?.fullName}</span>
                <div className="card-actions">
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => openEditForm(record.id)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => handleDelete(record.id, record.date)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="list-state">No growth records yet</div>
      )}
    </section>
  );
}

export default GrowthRecordsPanel;
