import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../App.css';

const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);

const formatDate = (value) => new Date(value).toLocaleDateString(undefined, {
  year: 'numeric', month: 'short', day: 'numeric',
});

function AccountSettings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState('');
  const [removingUserId, setRemovingUserId] = useState(null);

  const loadMembers = () => {
    setMembersLoading(true);
    setMembersError('');

    axios.get('/api/auth/members')
      .then((response) => setMembers(response.data))
      .catch((err) => setMembersError(err.response?.data?.error || 'Unable to load family members right now.'))
      .finally(() => setMembersLoading(false));
  };

  useEffect(() => {
    if (user?.role === 'owner') {
      loadMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const handleRemoveMember = async (member) => {
    if (!window.confirm(`Remove ${member.fullName} from the family? This cannot be undone.`)) {
      return;
    }

    setRemovingUserId(member.id);
    setMembersError('');

    try {
      await axios.delete(`/api/auth/members/${member.id}`);
      loadMembers();
    } catch (err) {
      setMembersError(err.response?.data?.error || 'Unable to remove this member right now.');
    } finally {
      setRemovingUserId(null);
    }
  };

  const handleCancel = () => {
    setConfirming(false);
    setPassword('');
    setError('');
  };

  const handleDelete = async (event) => {
    event.preventDefault();

    if (!password) {
      setError('Enter your current password to confirm.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await axios.delete('/api/auth/me', { data: { password } });
      logout();
      navigate('/login', { state: { message: 'Your account has been deleted.' } });
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to delete your account right now.');
      setSubmitting(false);
    }
  };

  if (!user) {
    return <div className="list-state">Loading account settings...</div>;
  }

  return (
    <section className="account-settings">
      <h2>Account Settings</h2>

      <div className="profile-section">
        <h3>Your info</h3>
        <dl className="account-info-list">
          <div className="account-info-row">
            <dt>Name</dt>
            <dd>{user.fullName}</dd>
          </div>
          <div className="account-info-row">
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div className="account-info-row">
            <dt>Role</dt>
            <dd>{capitalize(user.role)}</dd>
          </div>
        </dl>
      </div>

      {user.role === 'owner' && (
        <div className="profile-section">
          <h3>Family Members</h3>

          {membersError ? <p className="form-message error">{membersError}</p> : null}

          {membersLoading && <p className="profile-empty">Loading family members...</p>}

          {!membersLoading && members.length === 0 && !membersError && (
            <p className="profile-empty">No other family members yet.</p>
          )}

          {!membersLoading && members.length > 0 && (
            <ul className="member-list">
              {members.map((member) => (
                <li key={member.id} className="member-row">
                  <div className="member-info">
                    <span className="member-name">
                      {member.fullName}
                      {member.isSelf && ' (you)'}
                    </span>
                    <span className="member-meta">
                      {member.email} · {capitalize(member.role)} · Joined {formatDate(member.createdAt)}
                    </span>
                  </div>

                  {!member.isSelf && (
                    <button
                      type="button"
                      className="member-remove-button"
                      onClick={() => handleRemoveMember(member)}
                      disabled={removingUserId === member.id}
                    >
                      {removingUserId === member.id ? 'Removing...' : 'Remove'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="profile-section danger-zone">
        <h3>Danger Zone</h3>

        {!confirming && (
          <>
            <p className="profile-empty">
              Deleting your account is permanent and cannot be undone.
            </p>
            <button
              type="button"
              className="danger-button"
              onClick={() => setConfirming(true)}
            >
              Delete my account
            </button>
          </>
        )}

        {confirming && (
          <form className="child-form" onSubmit={handleDelete}>
            <p className="profile-empty">
              Enter your current password to permanently delete your account.
            </p>

            {error ? <p className="form-message error">{error}</p> : null}

            <label>
              Current password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoFocus
                required
              />
            </label>

            <div className="danger-confirm-actions">
              <button type="submit" className="danger-button" disabled={submitting}>
                {submitting ? 'Deleting...' : 'Confirm deletion'}
              </button>
              <button
                type="button"
                className="danger-cancel-button"
                onClick={handleCancel}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

export default AccountSettings;
