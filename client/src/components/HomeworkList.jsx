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

const URGENCY_LABELS = {
  overdue: 'Overdue',
  due_soon: 'Due soon',
  upcoming: 'Upcoming',
  done: 'Done',
};

const urgencyClassName = (urgency) => (urgency === 'due_soon' ? 'due-soon' : urgency);

function HomeworkList() {
  const { hasChildren, loading: childrenLoading, selectedChildId } = useChild();
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selectedChildId) {
      setHomework([]);
      setLoading(false);
      return;
    }

    const fetchHomework = async () => {
      setLoading(true);

      try {
        const response = await axios.get('/api/homework', {
          params: { childId: selectedChildId },
        });
        setHomework(response.data);
        setError('');
      } catch (err) {
        setError('Unable to load homework right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchHomework();
  }, [selectedChildId]);

  const handleDelete = async (id, title) => {
    const confirmed = window.confirm(`Delete "${title}"? This can't be undone.`);
    if (!confirmed) return;

    try {
      await axios.delete(`/api/homework/${id}`);
      setHomework((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      alert('Unable to delete this homework right now.');
    }
  };

  if (!childrenLoading && !hasChildren) {
    return <NoChildrenPrompt />;
  }

  if (loading) {
    return <div className="list-state">Loading homework...</div>;
  }

  if (error) {
    return <div className="list-state error">{error}</div>;
  }

  if (homework.length === 0) {
    return <div className="list-state">No homework yet</div>;
  }

  return (
    <section className="homework-list">
      <h2>Homework</h2>
      <div className="homework-grid">
        {homework.map((item) => (
          <article
            key={item.id}
            className={`homework-card ${urgencyClassName(item.urgency)}`}
          >
            <span className={`urgency-badge ${urgencyClassName(item.urgency)}`}>
              {URGENCY_LABELS[item.urgency] || item.urgency}
            </span>
            <h3>{item.title}</h3>
            <span className="category-badge">{item.subject}</span>
            <p><strong>Due:</strong> {formatDueDate(item.dueDate)}</p>
            <p><strong>Status:</strong> {item.status}</p>
            <span className="child-tag">{item.child?.fullName}</span>
            <div className="card-actions">
              <Link to={`/edit-homework/${item.id}`}>Edit</Link>
              <button
                type="button"
                className="delete-button"
                onClick={() => handleDelete(item.id, item.title)}
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

export default HomeworkList;
