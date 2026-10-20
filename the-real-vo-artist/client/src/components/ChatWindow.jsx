import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, API_BASE, getErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import Avatar from './Avatar.jsx';
import Spinner from './Spinner.jsx';
import { DOC_EXT_RE, MAX_DOC_MB, formatBytes } from '../lib/constants.js';

export default function ChatWindow({ conversationId, onRead }) {
  const { user } = useAuth();
  const socket = useSocket();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [otherTyping, setOtherTyping] = useState(false);

  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const typingTimer = useRef(null);
  const lastTypingSent = useRef(0);
  const stickToBottom = useRef(true);

  const addMessages = useCallback((incoming, prepend = false) => {
    setMessages((prev) => {
      const ids = new Set(prev.map((m) => m.id));
      const fresh = incoming.filter((m) => !ids.has(m.id));
      return prepend ? [...fresh, ...prev] : [...prev, ...fresh];
    });
  }, []);

  const markRead = useCallback(() => {
    socket?.emit('conversation:read', { conversationId });
    onRead?.(conversationId);
  }, [socket, conversationId, onRead]);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [c, m] = await Promise.all([
          api.get(`/conversations/${conversationId}`),
          api.get(`/conversations/${conversationId}/messages`),
        ]);
        if (cancelled) return;
        stickToBottom.current = true;
        setConversation(c.data.conversation);
        setMessages(m.data.messages);
        setNextCursor(m.data.nextCursor);
      } catch (e) {
        if (!cancelled) setError(getErrorMessage(e));
      }
    })();
    return () => { cancelled = true; };
  }, [conversationId]);

  useEffect(() => {
    markRead();
  }, [markRead]);

  // Real-time events
  useEffect(() => {
    if (!socket) return;
    const onNew = (msg) => {
      if (msg.conversationId !== conversationId) return;
      stickToBottom.current = true;
      addMessages([msg]);
      if (msg.senderId !== user.id) {
        setOtherTyping(false);
        markRead();
      }
    };
    const onTyping = ({ conversationId: cid }) => {
      if (cid !== conversationId) return;
      setOtherTyping(true);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setOtherTyping(false), 3000);
    };
    const onReadReceipt = ({ conversationId: cid }) => {
      if (cid !== conversationId) return;
      const now = new Date().toISOString();
      setMessages((prev) => prev.map((m) => (m.senderId === user.id && !m.readAt ? { ...m, readAt: now } : m)));
    };

    socket.on('message:new', onNew);
    socket.on('typing', onTyping);
    socket.on('conversation:read', onReadReceipt);
    return () => {
      socket.off('message:new', onNew);
      socket.off('typing', onTyping);
      socket.off('conversation:read', onReadReceipt);
      clearTimeout(typingTimer.current);
    };
  }, [socket, conversationId, user.id, addMessages, markRead]);

  useEffect(() => {
    if (stickToBottom.current) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherTyping]);

  const loadOlder = async () => {
    stickToBottom.current = false;
    try {
      const { data } = await api.get(`/conversations/${conversationId}/messages`, { params: { cursor: nextCursor } });
      addMessages(data.messages, true);
      setNextCursor(data.nextCursor);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const send = (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || !socket || sending) return;
    setSending(true);
    setError('');
    socket.timeout(10000).emit('message:send', { conversationId, body }, (err, res) => {
      setSending(false);
      if (err) return setError('Message timed out. Check your connection.');
      if (res?.error) return setError(res.error);
      setText('');
      stickToBottom.current = true;
      addMessages([res.message]);
    });
  };

  const onInput = (e) => {
    setText(e.target.value);
    const now = Date.now();
    if (socket && now - lastTypingSent.current > 2000) {
      lastTypingSent.current = now;
      socket.emit('typing', { conversationId });
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) send(e);
  };

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!DOC_EXT_RE.test(f.name)) return setError('Scripts must be PDF, DOC, DOCX or TXT');
    if (f.size > MAX_DOC_MB * 1024 * 1024) return setError(`File must be under ${MAX_DOC_MB}MB`);
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', f);
      const { data } = await api.post(`/conversations/${conversationId}/files`, fd);
      stickToBottom.current = true;
      addMessages([data.message]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  if (!conversation && !error) return <div className="flex flex-1 items-center justify-center"><Spinner /></div>;
  if (!conversation) return <p className="p-6 text-center text-red-400">{error}</p>;

  const { otherParty } = conversation;
  const lastMine = [...messages].reverse().find((m) => m.senderId === user.id);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <Link to="/messages" className="text-zinc-400 md:hidden" aria-label="Back">←</Link>
        <Avatar src={otherParty.avatarUrl} name={otherParty.name} size={38} />
        <div className="min-w-0">
          {otherParty.artistProfileId ? (
            <Link to={`/artists/${otherParty.artistProfileId}`} className="font-semibold hover:underline">{otherParty.name}</Link>
          ) : (
            <span className="font-semibold">{otherParty.name}</span>
          )}
          <p className="text-xs text-zinc-500">{otherTyping ? 'typing…' : socket?.connected ? 'Online chat' : 'Connecting…'}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {nextCursor && (
          <div className="text-center">
            <button onClick={loadOlder} className="text-xs text-violet-300 hover:underline">Load earlier messages</button>
          </div>
        )}
        {!messages.length && (
          <p className="pt-10 text-center text-sm text-zinc-500">
            {user.role === 'CLIENT' ? 'Introduce your project or attach your script 📄' : 'No messages yet.'}
          </p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === user.id;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${mine ? 'rounded-br-sm bg-violet-600' : 'rounded-bl-sm bg-white/10'}`}>
                {m.type === 'FILE' && m.file && (
                  <a
                    href={`${API_BASE}${m.file.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-1 flex items-center gap-3 rounded-xl bg-black/20 p-3 hover:bg-black/30"
                  >
                    <span className="text-2xl">📄</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{m.file.name}</span>
                      <span className="text-xs opacity-70">{formatBytes(m.file.size)} · Open</span>
                    </span>
                  </a>
                )}
                {m.body && <p className="whitespace-pre-wrap break-words text-sm">{m.body}</p>}
                <p className="mt-0.5 text-right text-[10px] opacity-60">
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {mine && m.id === lastMine?.id && (m.readAt ? ' · Seen' : ' · Sent')}
                </p>
              </div>
            </div>
          );
        })}
        {otherTyping && <p className="text-xs text-zinc-500">{otherParty.name} is typing…</p>}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form onSubmit={send} className="border-t border-white/10 p-3">
        {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
        <div className="flex items-end gap-2">
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-ghost px-3" aria-label="Attach script" title="Attach script (PDF, DOC, DOCX, TXT)">
            {uploading ? '⏳' : '📎'}
          </button>
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" hidden onChange={onFile} />
          <textarea
            value={text}
            onChange={onInput}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={5000}
            placeholder="Type a message or paste your script…"
            className="input max-h-40 min-h-[44px] flex-1 resize-y"
          />
          <button type="submit" disabled={!text.trim() || sending || !socket} className="btn-primary">
            {sending ? '…' : 'Send'}
          </button>
        </div>
        <p className="mt-1 text-[11px] text-zinc-500">Enter to send · Shift+Enter for new line · Long scripts? Attach a file.</p>
      </form>
    </div>
  );
}
