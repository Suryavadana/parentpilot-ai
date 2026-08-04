import { useEffect, useState } from 'react';
import axios from 'axios';
import { useChild } from '../context/ChildContext';
import NoChildrenPrompt from './NoChildrenPrompt';
import FeedbackForm from './FeedbackForm';
import '../App.css';

const CATEGORY_LABELS = {
  academic: 'Academic',
  behavioral: 'Behavioral',
  health: 'Health',
  general: 'General',
};

const formatDate = (value) => {
  if (!value) return '';

  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

function FeedbackPanel() {
  const { hasChildren, loading: childrenLoading, selectedChildId } = useChild();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingFeedbackId, setEditingFeedbackId] = useState(null);

  const fetchFeedback = async () => {
    if (!selectedChildId) {
      setFeedback([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await axios.get('/api/feedback', {
        params: { childId: selectedChildId },
      });
      setFeedback(response.data);
      setError('');
    } catch (err) {
      setError('Unable to load feedback right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChildId]);

  const openAddForm = () => {
    setEditingFeedbackId(null);
    setShowForm(true);
  };

  const openEditForm = (id) => {
    setEditingFeedbackId(id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingFeedbackId(null);
  };

  const handleSaved = () => {
    closeForm();
    fetchFeedback();
  };

  const handleDelete = async (id, source) => {
    const confirmed = window.confirm(`Delete feedback from "${source}"? This can't be undone.`);
    if (!confirmed) return;

    try {
      await axios.delete(`/api/feedback/${id}`);
      setFeedback((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      alert('Unable to delete this feedback right now.');
    }
  };

  if (!childrenLoading && !hasChildren) {
    return <NoChildrenPrompt />;
  }

  if (loading || childrenLoading) {
    return <div className="list-state">Loading feedback...</div>;
  }

  if (error) {
    return <div className="list-state error">{error}</div>;
  }

  const hasFeedback = feedback.length > 0;

  return (
    <section className="events-list">
      <div className="section-header">
        <h2>Feedback</h2>
        {hasFeedback && (
          <button
            type="button"
            className="toggle-form-button"
            onClick={showForm ? closeForm : openAddForm}
          >
            {showForm ? 'Cancel' : 'Add feedback'}
          </button>
        )}
      </div>

      {(showForm || !hasFeedback) && (
        <FeedbackForm feedbackId={editingFeedbackId} onSaved={handleSaved} />
      )}

      {hasFeedback ? (
        <div className="panel-list">
          {feedback.map((item) => (
            <article key={item.id} className="event-card">
              <h3>{item.source}</h3>
              <span className="category-badge">{CATEGORY_LABELS[item.category] || item.category}</span>
              <p>{formatDate(item.date)}</p>
              <p>{item.content}</p>
              <span className="child-tag">{item.child?.fullName}</span>
              <div className="card-actions">
                <button
                  type="button"
                  className="link-button"
                  onClick={() => openEditForm(item.id)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="delete-button"
                  onClick={() => handleDelete(item.id, item.source)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="list-state">No feedback yet</div>
      )}
    </section>
  );
}

export default FeedbackPanel;
