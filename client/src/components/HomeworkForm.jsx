import { useEffect, useState } from 'react';
import axios from 'axios';
import '../App.css';

const emptyForm = {
  title: '',
  subject: '',
  dueDate: '',
  status: 'not_started',
  notes: '',
  childId: '',
};

const toDateInput = (value) => {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
};

function HomeworkForm({ homeworkId, onSaved }) {
  const [formData, setFormData] = useState(emptyForm);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(Boolean(homeworkId));
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
    if (!homeworkId) {
      setFormData(emptyForm);
      setLoading(false);
      return;
    }

    const fetchHomework = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await axios.get(`/api/homework/${homeworkId}`);
        const homework = response.data;

        setFormData({
          title: homework.title || '',
          subject: homework.subject || '',
          dueDate: toDateInput(homework.dueDate),
          status: homework.status || 'not_started',
          notes: homework.notes || '',
          childId: homework.childId || '',
        });
      } catch (err) {
        setError('Unable to load homework.');
      } finally {
        setLoading(false);
      }
    };

    fetchHomework();
  }, [homeworkId]);

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

    if (!formData.title.trim() || !formData.subject.trim() || !formData.dueDate || !formData.childId) {
      setError('Title, subject, due date and child are required.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        title: formData.title.trim(),
        subject: formData.subject.trim(),
        notes: formData.notes.trim(),
      };

      if (homeworkId) {
        await axios.put(`/api/homework/${homeworkId}`, payload);
        setSuccessMessage('Homework updated successfully.');
      } else {
        await axios.post('/api/homework', payload);
        setSuccessMessage('Homework created successfully.');
        setFormData(emptyForm);
      }

      if (onSaved) {
        onSaved();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to save the homework.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="child-form-card">
      <h2>{homeworkId ? 'Edit homework' : 'Add homework'}</h2>

      {error ? <p className="form-message error">{error}</p> : null}
      {successMessage ? <p className="form-message success">{successMessage}</p> : null}

      {loading ? (
        <p className="form-loading">Loading homework...</p>
      ) : (
        <form className="child-form" onSubmit={handleSubmit}>
          <label>
            Title
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Subject
            <input
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Due date
            <input
              name="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Status
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
            >
              <option value="not_started">Not started</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </label>

          <label>
            Notes
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
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
            {submitting ? 'Saving...' : homeworkId ? 'Save changes' : 'Create homework'}
          </button>
        </form>
      )}
    </section>
  );
}

export default HomeworkForm;
