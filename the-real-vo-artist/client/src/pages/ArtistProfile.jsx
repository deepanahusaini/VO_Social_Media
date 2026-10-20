import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, getErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';
import Spinner from '../components/Spinner.jsx';
import { DEFAULT_LAYOUT, FONTS, GENDERS, formatPrice } from '../lib/constants.js';

function Section({ title, children }) {
  return (
    <section className="card">
      <h2 className="mb-4 text-xl font-bold text-[var(--theme)]">{title}</h2>
      {children}
    </section>
  );
}

const pauseOthers = (e) =>
  document.querySelectorAll('audio').forEach((a) => a !== e.currentTarget && a.pause());

export default function ArtistProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    setProfile(null);
    setError('');
    api.get(`/artists/${id}`)
      .then(({ data }) => { setProfile(data.profile); setIsOwner(data.isOwner); })
      .catch((e) => setError(e.response?.status === 404 ? 'This artist profile is not available.' : getErrorMessage(e)));
  }, [id]);

  const startChat = async () => {
    if (!user) return navigate('/client/auth', { state: { from: { pathname: `/artists/${id}` } } });
    setStarting(true);
    try {
      const { data } = await api.post('/conversations', { artistProfileId: id });
      navigate(`/messages/${data.conversationId}`);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setStarting(false);
    }
  };

  if (error && !profile) return <p className="p-10 text-center text-zinc-400">{error}</p>;
  if (!profile) return <Spinner full />;

  const layout = { ...DEFAULT_LAYOUT, ...profile.layout };
  const canMessage = !user || user.role === 'CLIENT';
  const gender = GENDERS.find((g) => g.value === profile.gender)?.label;

  const sections = {
    about: profile.bio ? (
      <Section key="about" title="About">
        <p className="whitespace-pre-line leading-relaxed text-zinc-300">{profile.bio}</p>
      </Section>
    ) : null,
    details: (
      <Section key="details" title="Details">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div><dt className="text-xs uppercase text-zinc-500">Languages</dt><dd>{profile.languages.join(', ') || '—'}</dd></div>
          <div><dt className="text-xs uppercase text-zinc-500">Voice styles</dt><dd>{profile.voiceStyles.join(', ') || '—'}</dd></div>
          <div><dt className="text-xs uppercase text-zinc-500">Gender</dt><dd>{gender || '—'}</dd></div>
          <div><dt className="text-xs uppercase text-zinc-500">Starting at</dt><dd>{formatPrice(profile.priceFrom, profile.currency)}</dd></div>
        </dl>
      </Section>
    ),
    samples: (
      <Section key="samples" title="Voice Samples">
        <div className="space-y-4">
          {profile.samples.map((s) => (
            <div key={s.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-zinc-400">{s.description}</p>
              <audio controls preload="none" src={s.url} onPlay={pauseOthers} className="mt-3 w-full" />
            </div>
          ))}
        </div>
      </Section>
    ),
  };

  return (
    <main style={{ '--theme': layout.themeColor, fontFamily: FONTS[layout.font]?.css }} className="pb-16">
      {isOwner && !profile.isComplete && (
        <div className="bg-amber-500/15 px-4 py-2 text-center text-sm text-amber-300">
          Preview — only you can see this. Upload all 3 samples to publish.
        </div>
      )}

      <div
        className="h-48 bg-cover bg-center sm:h-72"
        style={{ backgroundImage: profile.coverUrl ? `url(${profile.coverUrl})` : `linear-gradient(135deg, ${layout.themeColor}, #09090b)` }}
      />

      <div className="mx-auto max-w-4xl px-4">
        <div className="-mt-16 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="rounded-full border-4 border-[var(--theme)]">
              <Avatar src={profile.avatarUrl} name={profile.displayName} size={128} />
            </div>
            <div className="pb-2">
              <h1 className="text-3xl font-bold">{profile.displayName}</h1>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {profile.voiceStyles.slice(0, 4).map((s) => (
                  <span key={s} className="rounded-full bg-[var(--theme)]/20 px-2.5 py-0.5 text-xs" style={{ backgroundColor: `${layout.themeColor}33` }}>{s}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="pb-2">
            {isOwner ? (
              <Link to="/artist/profile/edit" className="btn-ghost">Edit profile</Link>
            ) : canMessage ? (
              <button onClick={startChat} disabled={starting} className="btn bg-[var(--theme)] text-white hover:opacity-90">
                💬 {starting ? 'Opening…' : 'Message'}
              </button>
            ) : null}
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <div className="mt-8 space-y-6">{layout.sectionOrder.map((key) => sections[key])}</div>
      </div>
    </main>
  );
}
