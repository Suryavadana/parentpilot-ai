import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import '../App.css';

function AssistantChat() {
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

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
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: 'assistant', text: response.data.reply },
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
