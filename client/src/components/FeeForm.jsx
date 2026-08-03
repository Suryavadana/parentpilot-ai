import { useEffect, useState } from 'react';
import axios from 'axios';
import '../App.css';

const emptyForm = {
  description: '',
  amount: '',
  dueDate: '',
  status: 'unpaid',
  childId: '',
};

const toDateInput = (value) => {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
};

function FeeForm({ feeId, onSaved }) {
  const [formData, setFormData] = useState(emptyForm);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(Boolean(feeId));
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
    if (!feeId) {
      setFormData(emptyForm);
      setLoading(false);
      return;
    }

    const fetchFee = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await axios.get(`/api/fees/${feeId}`);
        const fee = response.data;

        setFormData({
          description: fee.description || '',
          amount: fee.amount !== undefined && fee.amount !== null ? String(fee.amount) : '',
          dueDate: toDateInput(fee.dueDate),
          status: fee.status || 'unpaid',
          childId: fee.childId || '',
        });
      } catch (err) {
        setError('Unable to load fee.');
      } finally {
        setLoading(false);
      }
    };

    fetchFee();
  }, [feeId]);

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

    if (!formData.description.trim() || !formData.amount || !formData.dueDate || !formData.childId) {
      setError('Description, amount, due date and child are required.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        description: formData.description.trim(),
      };

      if (feeId) {
        await axios.put(`/api/fees/${feeId}`, payload);
        setSuccessMessage('Fee updated successfully.');
      } else {
        await axios.post('/api/fees', payload);
        setSuccessMessage('Fee created successfully.');
        setFormData(emptyForm);
      }

      if (onSaved) {
        onSaved();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to save the fee.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="child-form-card">
      <h2>{feeId ? 'Edit fee' : 'Add fee'}</h2>

      {error ? <p className="form-message error">{error}</p> : null}
      {successMessage ? <p className="form-message success">{successMessage}</p> : null}

      {loading ? (
        <p className="form-loading">Loading fee...</p>
      ) : (
        <form className="child-form" onSubmit={handleSubmit}>
          <label>
            Description
            <input
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Amount
            <input
              name="amount"
              type="number"
              step="0.01"
              value={formData.amount}
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
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
            </select>
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
            {submitting ? 'Saving...' : feeId ? 'Save changes' : 'Create fee'}
          </button>
        </form>
      )}
    </section>
  );
}

export default FeeForm;
