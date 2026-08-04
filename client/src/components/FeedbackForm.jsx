import { useEffect, useState } from 'react';
import axios from 'axios';
import '../App.css';

const emptyForm = {
  source: '',
  category: '',
  content: '',
  date: '',
  childId: '',
};

const toDateInput = (value) => {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
};

function FeedbackForm({ feedbackId, onSaved }) {
  const [formData, setFormData] = useState(emptyForm);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(Boolean(feedbackId));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const response = await axios.get('/api/children');
        setChildren(response.data);
      } catch (err) {
        // Children dropdown is required to submit; leave it empty if it fails to load.
      }
    };

    fetchChildren();
  }, []);

  useEffect(() => {
    if (!feedbackId) {
      setFormData(emptyForm);
      setLoading(false);
      return;
    }

    const fetchFeedback = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await axios.get(`/api/feedback/${feedbackId}`);
        const feedback = response.data;

        setFormData({
          source: feedback.source || '',
          category: feedback.category || '',
          content: feedback.content || '',
          date: toDateInput(feedback.date),
          childId: feedback.childId || '',
        });
      } catch (err) {
        setError('Unable to load feedback.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [feedbackId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (
      !formData.source.trim()
      || !formData.category
      || !formData.content.trim()
      || !formData.date
      || !formData.childId
    ) {
      setError('Source, category, content, date and child are required.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        source: formData.source.trim(),
        category: formData.category,
        content: formData.content.trim(),
        date: formData.date,
        childId: formData.childId,
      };

      if (feedbackId) {
        await axios.put(`/api/feedback/${feedbackId}`, payload);
        setSuccessMessage('Feedback updated successfully.');
      } else {
        await axios.post('/api/feedback', payload);
        setSuccessMessage('Feedback created successfully.');
        setFormData(emptyForm);
      }

      if (onSaved) {
        onSaved();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to save the feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="child-form-card">
      <h2>{feedbackId ? 'Edit feedback' : 'Add feedback'}</h2>

      {error ? <p className="form-message error">{error}</p> : null}
      {successMessage ? <p className="form-message success">{successMessage}</p> : null}

      {loading ? (
        <p className="form-loading">Loading feedback...</p>
      ) : (
        <form className="child-form" onSubmit={handleSubmit}>
          <label>
            Source
            <input
              name="source"
              value={formData.source}
              onChange={handleChange}
              placeholder="e.g. Teacher - Ms. Johnson"
              required
            />
          </label>

          <label>
            Category
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select a category</option>
              <option value="academic">Academic</option>
              <option value="behavioral">Behavioral</option>
              <option value="health">Health</option>
              <option value="general">General</option>
            </select>
          </label>

          <label>
            Content
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows={5}
              required
            />
          </label>

          <label>
            Date
            <input
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Child
            <select
              name="childId"
              value={formData.childId}
              onChange={handleChange}
              required
            >
              <option value="">Select a child</option>
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.fullName}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : feedbackId ? 'Save changes' : 'Create feedback'}
          </button>
        </form>
      )}
    </section>
  );
}

export default FeedbackForm;
