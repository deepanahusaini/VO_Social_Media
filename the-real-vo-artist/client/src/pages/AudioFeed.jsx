import { useCallback, useEffect, useRef, useState } from 'react';
import { api, getErrorMessage } from '../api/client.js';
import AudioCard from '../components/AudioCard.jsx';
import Spinner from '../components/Spinner.jsx';

export default function AudioFeed() {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [active, setActive] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const loadingRef = useRef(false);

  const load = useCallback(async (c) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const { data } = await api.get('/feed', { params: { cursor: c ?? undefined, limit: 8 } });
      setItems((prev) => (c ? [...prev, ...data.items] : data.items));
      setCursor(data.nextCursor);
      setHasMore(Boolean(data.nextCursor));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      loadingRef.current = false;
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    load(null);
  }, [load]);

  // Prefetch the next page when nearing the end
  useEffect(() => {
    if (hasMore && items.length && active >= items.length - 2) load(cursor);
  }, [active, items.length, hasMore, cursor, load]);

  if (initialLoading) return <Spinner full />;

  return (
    <div className="no-scrollbar mx-auto h-[calc(100dvh-3.5rem)] max-w-md snap-y snap-mandatory overflow-y-scroll bg-black">
      {items.map((sample, i) => (
        <AudioCard key={sample.id} sample={sample} index={i} isActive={i === active} onVisible={setActive} />
      ))}

      {!items.length && (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-zinc-400">
          <p className="text-4xl">🎙️</p>
          <p>No voices yet. Check back soon!</p>
        </div>
      )}
      {error && <p className="p-4 text-center text-sm text-red-400">{error}</p>}
      {!hasMore && items.length > 0 && (
        <div className="flex h-24 snap-start items-center justify-center text-sm text-zinc-500">You're all caught up ✨</div>
      )}
    </div>
  );
}
