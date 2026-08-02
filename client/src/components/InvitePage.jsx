import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../App.css';

function InvitePage() {
  const { user, generateInvite } = useAuth();
  const [role, setRole] = useState('parent');
  const [inviteToken, setInviteToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user?.role !== 'owner') {
    return (
      <section className="child-form-card">
        <h2>Invite a family member</h2>
        <p className="list-state">Only family owners can send invites.</p>
      </section>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setCopied(false);
    setSubmitting(true);

    try {
      const token = await generateInvite(role);
      setInviteToken(token);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to create invite.');
    } finally {
      setSubmitting(false);
    }
  };

  const inviteLink = inviteToken
    ? `${window.location.origin}/join?token=${inviteToken}`
    : '';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
  };

  return (
    <section className="child-form-card">
      <h2>Invite a family member</h2>

      {error ? <p className="form-message error">{error}</p> : null}

      <form className="child-form" onSubmit={handleSubmit}>
        <label>
          Role
          <select value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="parent">Parent</option>
            <option value="caregiver">Caregiver</option>
          </select>
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Generating...' : 'Generate invite link'}
        </button>
      </form>

      {inviteLink ? (
        <div className="invite-link-box">
          <input type="text" value={inviteLink} readOnly />
          <button type="button" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      ) : null}
    </section>
  );
}

export default InvitePage;
