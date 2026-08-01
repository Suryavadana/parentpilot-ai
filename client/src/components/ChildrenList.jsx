import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../App.css';

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return 'Unknown';

  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return `${age} years`;
};

function ChildrenList() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const response = await axios.get('/api/children');
        setChildren(response.data);
      } catch (err) {
        setError('Unable to load children right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, []);

  const handleDelete = async (id, fullName) => {
    const confirmed = window.confirm(`Delete ${fullName}'s profile? This can't be undone.`);
    if (!confirmed) return;

    try {
      await axios.delete(`/api/children/${id}`);
      setChildren((current) => current.filter((child) => child.id !== id));
    } catch (err) {
      alert('Unable to delete this profile right now.');
    }
  };

  if (loading) {
    return <div className="list-state">Loading children...</div>;
  }

  if (error) {
    return <div className="list-state error">{error}</div>;
  }

  if (children.length === 0) {
    return <div className="list-state">No children added yet</div>;
  }

  return (
    <section className="children-list">
      <h2>Children</h2>
      <div className="children-grid">
        {children.map((child) => (
          <article key={child.id} className="child-card">
            <h3>{child.fullName}</h3>
            <p><strong>Age:</strong> {calculateAge(child.dateOfBirth)}</p>
            <p><strong>School:</strong> {child.school || '—'}</p>
            <p><strong>Grade:</strong> {child.grade || '—'}</p>
            <div className="card-actions">
              <Link to={`/edit/${child.id}`}>Edit</Link>
              <button
                type="button"
                className="delete-button"
                onClick={() => handleDelete(child.id, child.fullName)}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ChildrenList;