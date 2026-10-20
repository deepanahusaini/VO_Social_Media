import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import ChatList from '../components/ChatList.jsx';
import ChatWindow from '../components/ChatWindow.jsx';

export default function Messages() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const socket = useSocket();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const convosRef = useRef([]);

  useEffect(() => {
    convosRef.current = conversations;
  }, [conversations]);

  const loadList = useCallback(async () => {
    try {
      const { data } = await api.get('/conversations');
      setConversations(data.conversations);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  // Keep the list fresh: bump conversation to top, update preview + unread count
  useEffect(() => {
    if (!socket) return;
    const onNew = (msg) => {
      if (!convosRef.current.some((c) => c.id === msg.conversationId)) {
        loadList(); // brand-new conversation
        return;
      }
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === msg.conversationId);
        if (idx === -1) return prev;
        const c = prev[idx];
        const countsAsUnread = msg.senderId !== user.id && msg.conversationId !== conversationId;
        const updated = {
          ...c,
          lastMessage: msg,
          lastMessageAt: msg.createdAt,
          unreadCount: countsAsUnread ? c.unreadCount + 1 : c.unreadCount,
        };
        return [updated, ...prev.filter((_, i) => i !== idx)];
      });
    };
    socket.on('message:new', onNew);
    return () => socket.off('message:new', onNew);
  }, [socket, user.id, conversationId, loadList]);

  const markRead = useCallback((id) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)));
  }, []);

  return (
    <div className="mx-auto flex h-[calc(100dvh-3.5rem)] max-w-6xl border-x border-white/10">
      <aside className={`${conversationId ? 'hidden md:block' : 'block'} w-full border-r border-white/10 md:w-80`}>
        <ChatList conversations={conversations} activeId={conversationId} loading={loading} />
      </aside>
      <section className={`${conversationId ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col`}>
        {conversationId ? (
          <ChatWindow key={conversationId} conversationId={conversationId} onRead={markRead} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-zinc-500">Select a conversation</div>
        )}
      </section>
    </div>
  );
}
