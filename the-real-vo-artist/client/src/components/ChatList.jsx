import { Link } from 'react-router-dom';
import Avatar from './Avatar.jsx';
import Spinner from './Spinner.jsx';

const timeLabel = (iso) => {
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString()
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export default function ChatList({ conversations, activeId, loading }) {
  return (
    <div className="flex h-full flex-col">
      <h2 className="border-b border-white/10 px-4 py-3 text-lg font-bold">Messages</h2>
      <div className="flex-1 overflow-y-auto">
        {loading && <div className="flex justify-center p-6"><Spinner /></div>}
        {!loading && !conversations.length && (
          <p className="p-6 text-center text-sm text-zinc-500">No conversations yet.</p>
        )}
        {conversations.map((c) => {
          const last = c.lastMessage;
          const preview = last ? (last.type === 'FILE' ? `📎 ${last.file?.name}` : last.body) : 'Say hello 👋';
          return (
            <Link
              key={c.id}
              to={`/messages/${c.id}`}
              className={`flex items-center gap-3 border-b border-white/5 px-4 py-3 transition hover:bg-white/5 ${c.id === activeId ? 'bg-white/10' : ''}`}
            >
              <Avatar src={c.otherParty.avatarUrl} name={c.otherParty.name} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-semibold">{c.otherParty.name}</span>
                  <span className="shrink-0 text-xs text-zinc-500">{timeLabel(c.lastMessageAt)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className={`truncate text-sm ${c.unreadCount ? 'text-white' : 'text-zinc-400'}`}>{preview}</span>
                  {c.unreadCount > 0 && (
                    <span className="shrink-0 rounded-full bg-violet-600 px-2 py-0.5 text-xs font-semibold">{c.unreadCount}</span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
