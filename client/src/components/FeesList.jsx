import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useChild } from '../context/ChildContext';
import NoChildrenPrompt from './NoChildrenPrompt';
import '../App.css';

const formatDueDate = (dueDate) => {
  const date = new Date(dueDate);

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatAmount = (amount) => `$${Number(amount).toFixed(2)}`;

const URGENCY_LABELS = {
  overdue: 'Overdue',
  due_soon: 'Due soon',
  upcoming: 'Upcoming',
  done: 'Paid',
  paid: 'Paid',
};

const urgencyClassName = (urgency) => {
  if (urgency === 'due_soon') return 'due-soon';
  if (urgency === 'paid') return 'done';
  return urgency;
};

function FeesList() {
  const { hasChildren, loading: childrenLoading, selectedChildId } = useChild();
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selectedChildId) {
      setFees([]);
      setLoading(false);
      return;
    }

    const fetchFees = async () => {
      setLoading(true);

      try {
        const response = await axios.get('/api/fees', {
          params: { childId: selectedChildId },
        });
        setFees(response.data);
        setError('');
      } catch (err) {
        if (err.response?.status === 403) {
          setError("You don't have permission to view this.");
        } else {
          setError('Unable to load fees right now.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFees();
  }, [selectedChildId]);

  const handleDelete = async (id, description) => {
    const confirmed = window.confirm(`Delete "${description}"? This can't be undone.`);
    if (!confirmed) return;

    try {
      await axios.delete(`/api/fees/${id}`);
      setFees((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      alert('Unable to delete this fee right now.');
    }
  };

  if (!childrenLoading && !hasChildren) {
    return <NoChildrenPrompt />;
  }

  if (loading) {
    return <div className="list-state">Loading fees...</div>;
  }

  if (error) {
    return <div className="list-state error">{error}</div>;
  }

  if (fees.length === 0) {
    return <div className="list-state">No fees yet</div>;
  }

  return (
    <section className="homework-list">
      <h2>Fees</h2>
      <div className="homework-grid">
        {fees.map((item) => (
          <article
            key={item.id}
            className={`homework-card ${urgencyClassName(item.urgency)}`}
          >
            <span className={`urgency-badge ${urgencyClassName(item.urgency)}`}>
              {URGENCY_LABELS[item.urgency] || item.urgency}
            </span>
            <h3>{item.description}</h3>
            <p><strong>Amount:</strong> {formatAmount(item.amount)}</p>
            <p><strong>Due:</strong> {formatDueDate(item.dueDate)}</p>
            <p><strong>Status:</strong> {item.status}</p>
            <span className="child-tag">{item.child?.fullName}</span>
            <div className="card-actions">
              <Link to={`/edit-fee/${item.id}`}>Edit</Link>
              <button
                type="button"
                className="delete-button"
                onClick={() => handleDelete(item.id, item.description)}
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

export default FeesList;
