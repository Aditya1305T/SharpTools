import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { messageService } from '../services/api';
import Avatar from '../components/Avatar';

export default function MessagesPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  async function loadMessages() {
    try {
      const data = await messageService.getAll();
      setMessages(data);
    } catch { addToast('Failed to load messages', 'warning'); }
  }

  useEffect(() => { loadMessages(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function send(e) {
    e.preventDefault();
    if (!input.trim()) return;
    try {
      const msg = await messageService.send({ content: input.trim() });
      setMessages(prev => [...prev, msg]);
      setInput('');
    } catch { addToast('Failed to send message', 'warning'); }
  }

  const isMine = (m) => m.sender_id === user?.id;

  function formatTime(ts) {
    return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  function formatDay(ts) {
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <div className="page-enter" style={{ padding: '28px 32px', maxWidth: 760, margin: '0 auto' }}>
      <h1 className="section-title" style={{ marginBottom: 4 }}>Messages</h1>
      <p className="section-subtitle" style={{ marginBottom: 20 }}>
        {user?.role === 'admin' ? 'Chat with customers' : 'Chat with CutPro support'}
      </p>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 520 }}>
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar initials={user?.role === 'admin' ? 'C' : 'AU'} size={36} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{user?.role === 'admin' ? 'All Customers' : 'CutPro Support'}</div>
            <div style={{ fontSize: 11, color: 'var(--success)' }}>● Online</div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--text-muted)', fontSize: 14 }}>
              No messages yet. Start the conversation!
            </div>
          )}
          {messages.map((m, idx) => {
            const mine = isMine(m);
            const prevMsg = messages[idx - 1];
            const showDate = !prevMsg || formatDay(prevMsg.created_at) !== formatDay(m.created_at);
            return (
              <div key={m.id}>
                {showDate && (
                  <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', letterSpacing: 1, margin: '8px 0' }}>
                    {formatDay(m.created_at)}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: mine ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
                  <Avatar initials={mine ? (user?.initials || '?') : (m.sender_initials || 'AU')} size={28} />
                  <div>
                    <div className={`chat-bubble ${mine ? 'sent' : 'received'}`}>{m.content}</div>
                    <div className="chat-time" style={{ textAlign: mine ? 'right' : 'left' }}>{formatTime(m.created_at)}</div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={send} style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
          <input className="input-field" placeholder="Type a message..." value={input} onChange={e => setInput(e.target.value)} style={{ flex: 1 }} />
          <button type="submit" className="btn btn-primary">Send →</button>
        </form>
      </div>
    </div>
  );
}
