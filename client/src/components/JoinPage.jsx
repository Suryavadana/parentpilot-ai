import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../App.css';

function JoinPage() {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('token');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { joinFamily } = useAuth();
  const navigate = useNavigate();

  if (!inviteToken) {
    return (
      <section className="child-form-card">
        <h2>Join a family</h2>
        <p className="form-message error">This invite link is missing or invalid.</p>
      </section>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password || !fullName.trim()) {
      setError('Email, password and full name are required.');
      return;
    }

    setSubmitting(true);

    try {
      await joinFamily(inviteToken, email.trim(), password, fullName.trim());
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to join family.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="child-form-card">
      <h2>Join a family</h2>

      {error ? <p className="form-message error">{error}</p> : null}

      <form className="child-form" onSubmit={handleSubmit}>
        <label>
          Full name
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Joining...' : 'Join family'}
        </button>
      </form>
    </section>
  );
}

export default JoinPage;
