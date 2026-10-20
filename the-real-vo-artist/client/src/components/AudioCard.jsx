import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from './Avatar.jsx';

export default function AudioCard({ sample, index, isActive, onVisible }) {
  const cardRef = useRef(null);
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const [progress, setProgress] = useState(0);
  const { artist } = sample;
  const theme = artist.layout?.themeColor || '#7c3aed';

  // Report visibility so the feed knows which card is "on screen"
  useEffect(() => {
    const el = cardRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && onVisible(index),
      { threshold: 0.7 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [index, onVisible]);

  const tryPlay = () => {
    audioRef.current
      ?.play()
      .then(() => setNeedsTap(false))
      .catch(() => setNeedsTap(true)); // browser blocked autoplay until user gesture
  };

  // Autoplay when active, pause + rewind when scrolled away
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isActive) {
      audio.currentTime = 0;
      tryPlay();
    } else {
      audio.pause();
    }
  }, [isActive]);

  const toggle = () => {
    const a = audioRef.current;
    if (a.paused) tryPlay();
    else a.pause();
  };

  return (
    <section
      ref={cardRef}
      className="relative flex h-full w-full snap-start snap-always items-center justify-center overflow-hidden"
      style={{ background: `radial-gradient(circle at 50% 35%, ${theme}66, #000 70%)` }}
    >
      <audio
        ref={audioRef}
        src={sample.url}
        preload={isActive ? 'auto' : 'none'}
        loop
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => {
          const a = e.currentTarget;
          setProgress(a.duration ? a.currentTime / a.duration : 0);
        }}
      />

      {/* Full-card tap target for play/pause */}
      <button onClick={toggle} className="absolute inset-0 z-0" aria-label={playing ? 'Pause' : 'Play'} />

      {/* Center visual */}
      <div className="pointer-events-none flex flex-col items-center gap-6">
        <div className={`rounded-full p-1.5 transition ${playing ? 'animate-pulse' : ''}`} style={{ boxShadow: `0 0 80px ${theme}` }}>
          <Avatar src={artist.avatarUrl} name={artist.displayName} size={160} />
        </div>
        <div className="flex h-12 items-end gap-1.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <span
              key={i}
              className={`w-2 rounded-full ${playing ? 'eq-bar' : ''}`}
              style={{ height: playing ? '100%' : '20%', background: theme, animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
        {!playing && (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-3xl backdrop-blur">▶</div>
        )}
        {needsTap && !playing && <p className="text-sm text-zinc-300">Tap to play</p>}
      </div>

      {/* Info overlay */}
      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5 pb-8">
        <Link to={`/artists/${artist.id}`} className="mb-2 inline-flex items-center gap-2 font-semibold hover:underline">
          <Avatar src={artist.avatarUrl} name={artist.displayName} size={32} />
          {artist.displayName}
        </Link>
        <h3 className="text-lg font-bold">{sample.title}</h3>
        <p className="line-clamp-2 text-sm text-zinc-300">{sample.description}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[...artist.voiceStyles.slice(0, 3), ...artist.languages.slice(0, 2)].map((t) => (
            <span key={t} className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{t}</span>
          ))}
        </div>
      </div>

      {/* Side action */}
      <div className="absolute bottom-32 right-4 z-10">
        <Link
          to={`/artists/${artist.id}`}
          className="flex flex-col items-center gap-1 text-xs"
          aria-label={`Open ${artist.displayName}'s profile`}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full text-xl" style={{ background: theme }}>👤</span>
          Profile
        </Link>
      </div>

      {/* Progress */}
      <div className="absolute inset-x-0 bottom-0 z-10 h-1 bg-white/10">
        <div className="h-full" style={{ width: `${progress * 100}%`, background: theme }} />
      </div>
    </section>
  );
}
