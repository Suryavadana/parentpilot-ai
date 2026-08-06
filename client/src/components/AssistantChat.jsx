import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import '../App.css';

const PROPOSAL_ENDPOINTS = {
  homework: '/api/homework',
  event: '/api/events',
  appointment: '/api/appointments',
};

const PROPOSAL_TYPE_LABELS = {
  homework: 'Homework',
  event: 'Event',
  appointment: 'Appointment',
};

const CATEGORY_LABELS = {
  school: 'School',
  activity: 'Activity',
  medical: 'Medical',
  family: 'Family',
  announcement: 'Announcement',
};

const buildProposalPayload = (proposal) => {
  if (proposal.type === 'homework') {
    return {
      title: proposal.title,
      subject: proposal.subject,
      dueDate: proposal.dueDate,
      childId: proposal.childId,
    };
  }

  if (proposal.type === 'event') {
    return {
      title: proposal.title,
      category: proposal.category,
      startDate: proposal.startDate,
      childId: proposal.childId || null,
      description: proposal.description || '',
    };
  }

  if (proposal.type === 'appointment') {
    return {
      reason: proposal.reason,
      scheduledAt: proposal.scheduledAt,
      childId: proposal.childId,
      doctorId: proposal.doctorId || null,
    };
  }

  return null;
};

const formatProposalDate = (value) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(value.includes('T') ? { hour: 'numeric', minute: '2-digit' } : {}),
  });
};

function AssistantChat() {
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [children, setChildren] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  useEffect(() => {
    // Proposal cards must show human-readable names, not raw ids — otherwise
    // the user has no real way to catch the assistant proposing the wrong
    // child or doctor before confirming.
    axios.get('/api/children').then((response) => setChildren(response.data)).catch(() => {});
    axios.get('/api/doctors').then((response) => setDoctors(response.data)).catch(() => {});
  }, []);

  const getChildName = (childId) => {
    if (!childId) return 'Family-wide';
    const child = children.find((item) => item.id === childId);
    return child ? child.fullName : 'Unknown child';
  };

  const getDoctorName = (doctorId) => {
    const doctor = doctors.find((item) => item.id === doctorId);
    return doctor ? doctor.name : 'Unknown doctor';
  };

  const updateProposal = (messageId, proposalId, updates) => {
    setMessages((current) => current.map((message) => {
      if (message.id !== messageId) return message;

      return {
        ...message,
        proposals: message.proposals.map((proposal) => (
          proposal.id === proposalId ? { ...proposal, ...updates } : proposal
        )),
      };
    }));
  };

  const handleDismiss = (messageId, proposalId) => {
    setMessages((current) => current.map((message) => {
      if (message.id !== messageId) return message;

      return {
        ...message,
        proposals: message.proposals.filter((proposal) => proposal.id !== proposalId),
      };
    }));
  };

  const handleConfirm = async (messageId, proposal) => {
    const endpoint = PROPOSAL_ENDPOINTS[proposal.type];
    if (!endpoint) return;

    updateProposal(messageId, proposal.id, { status: 'saving', error: '' });

    try {
      await axios.post(endpoint, buildProposalPayload(proposal));
      updateProposal(messageId, proposal.id, { status: 'saved' });
    } catch (err) {
      updateProposal(messageId, proposal.id, {
        status: 'pending',
        error: err.response?.data?.error || 'Unable to save this right now.',
      });
    }
  };

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || sending) return;

    setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'user', text: trimmed }]);
    setInputValue('');
    setSending(true);

    try {
      const response = await axios.post('/api/assistant/chat', {
        message: trimmed,
        history,
      });

      setHistory(response.data.history || []);

      const proposals = (response.data.proposedActions || []).map((action) => ({
        id: crypto.randomUUID(),
        status: 'pending',
        error: '',
        ...action,
      }));

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(), role: 'assistant', text: response.data.reply, proposals,
        },
      ]);
    } catch (err) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'error',
          text: err.response?.data?.error || 'Unable to reach the assistant right now.',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    handleSend();
  };

  const renderProposalDetails = (proposal) => {
    if (proposal.type === 'homework') {
      return (
        <>
          <h4>{proposal.title}</h4>
          <p className="proposal-meta">
            {proposal.subject} · Due {formatProposalDate(proposal.dueDate)} · {getChildName(proposal.childId)}
          </p>
        </>
      );
    }

    if (proposal.type === 'event') {
      return (
        <>
          <h4>{proposal.title}</h4>
          <p className="proposal-meta">
            {CATEGORY_LABELS[proposal.category] || proposal.category}
            {' · '}
            {formatProposalDate(proposal.startDate)}
            {' · '}
            {getChildName(proposal.childId)}
          </p>
          {proposal.description && <p className="proposal-description">{proposal.description}</p>}
        </>
      );
    }

    if (proposal.type === 'appointment') {
      return (
        <>
          <h4>{proposal.reason}</h4>
          <p className="proposal-meta">
            {formatProposalDate(proposal.scheduledAt)}
            {' · '}
            {getChildName(proposal.childId)}
            {proposal.doctorId && ` · Doctor: ${getDoctorName(proposal.doctorId)}`}
          </p>
        </>
      );
    }

    return <p className="proposal-meta">Unrecognized proposal type: {proposal.type}</p>;
  };

  return (
    <section className="assistant-chat">
      <h2>Assistant</h2>

      <div className="assistant-messages">
        {messages.length === 0 && (
          <div className="assistant-welcome">
            Ask me about homework, fees, events, appointments, or medications for your family.
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`assistant-message ${message.role}`}>
            {message.text}

            {message.proposals && message.proposals.length > 0 && (
              <div className="proposal-cards">
                {message.proposals.map((proposal) => (
                  <div key={proposal.id} className={`proposal-card proposal-${proposal.status}`}>
                    <span className="proposal-type-badge">
                      {PROPOSAL_TYPE_LABELS[proposal.type] || proposal.type}
                    </span>

                    {renderProposalDetails(proposal)}

                    {proposal.error && <p className="proposal-error">{proposal.error}</p>}

                    {proposal.status === 'saved' ? (
                      <p className="proposal-saved">✓ Saved</p>
                    ) : (
                      <div className="proposal-actions">
                        <button
                          type="button"
                          onClick={() => handleConfirm(message.id, proposal)}
                          disabled={proposal.status === 'saving'}
                        >
                          {proposal.status === 'saving' ? 'Saving...' : 'Confirm & Save'}
                        </button>
                        <button
                          type="button"
                          className="proposal-dismiss"
                          onClick={() => handleDismiss(message.id, proposal.id)}
                          disabled={proposal.status === 'saving'}
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {sending && (
          <div className="assistant-message assistant thinking">Assistant is thinking...</div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="assistant-input-row" onSubmit={handleSubmit}>
        <textarea
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about homework, fees, events, appointments, or medications..."
          rows={1}
        />
        <button type="submit" disabled={!inputValue.trim() || sending}>
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </section>
  );
}

export default AssistantChat;
