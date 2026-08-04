import { useEffect, useState } from 'react';
import axios from 'axios';
import { useChild } from '../context/ChildContext';
import DoctorForm from './DoctorForm';
import '../App.css';

function DoctorsPanel() {
  const { selectedChildId } = useChild();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingDoctorId, setEditingDoctorId] = useState(null);

  const fetchDoctors = async () => {
    setLoading(true);

    try {
      const response = await axios.get('/api/doctors', {
        params: selectedChildId ? { childId: selectedChildId } : {},
      });
      setDoctors(response.data);
      setError('');
    } catch (err) {
      setError('Unable to load doctors right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChildId]);

  const openAddForm = () => {
    setEditingDoctorId(null);
    setShowForm(true);
  };

  const openEditForm = (id) => {
    setEditingDoctorId(id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingDoctorId(null);
  };

  const handleSaved = () => {
    closeForm();
    fetchDoctors();
  };

  const handleDelete = async (id, name) => {
    const confirmed = window.confirm(`Delete "${name}"? This can't be undone.`);
    if (!confirmed) return;

    try {
      await axios.delete(`/api/doctors/${id}`);
      setDoctors((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      alert('Unable to delete this doctor right now.');
    }
  };

  if (loading) {
    return <div className="list-state">Loading doctors...</div>;
  }

  if (error) {
    return <div className="list-state error">{error}</div>;
  }

  const hasDoctors = doctors.length > 0;

  return (
    <section className="events-list">
      <div className="section-header">
        <h2>Doctors</h2>
        {hasDoctors && (
          <button
            type="button"
            className="toggle-form-button"
            onClick={showForm ? closeForm : openAddForm}
          >
            {showForm ? 'Cancel' : 'Add doctor'}
          </button>
        )}
      </div>

      {(showForm || !hasDoctors) && (
        <DoctorForm doctorId={editingDoctorId} onSaved={handleSaved} />
      )}

      {hasDoctors ? (
        <div className="panel-list">
          {doctors.map((doctor) => (
            <article key={doctor.id} className="event-card">
              <h3>{doctor.name}</h3>
              {doctor.specialty && <span className="category-badge">{doctor.specialty}</span>}
              {(doctor.phone || doctor.email || doctor.address) && (
                <p>
                  {[doctor.phone, doctor.email, doctor.address].filter(Boolean).join(' · ')}
                </p>
              )}
              {doctor.notes && <p>{doctor.notes}</p>}
              {doctor.childId ? (
                <span className="child-tag">{doctor.child?.fullName}</span>
              ) : (
                <span className="child-tag">Family doctor</span>
              )}
              <div className="card-actions">
                <button
                  type="button"
                  className="link-button"
                  onClick={() => openEditForm(doctor.id)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="delete-button"
                  onClick={() => handleDelete(doctor.id, doctor.name)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="list-state">No doctors yet</div>
      )}
    </section>
  );
}

export default DoctorsPanel;
