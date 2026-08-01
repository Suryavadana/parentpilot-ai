import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../App.css';

function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password || !fullName.trim()) {
      setError('Email, password and full name are required.');
      return;
    }

    setSubmitting(true);

    try {
      await signup(email.trim(), password, fullName.trim());
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to sign up.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="child-form-card">
      <h2>Sign up</h2>

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
          {submitting ? 'Signing up...' : 'Sign up'}
        </button>
      </form>
    </section>
  );
}

export default SignupForm;
