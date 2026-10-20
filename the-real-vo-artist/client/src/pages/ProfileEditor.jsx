import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import AudioUploader from '../components/AudioUploader.jsx';
import LayoutEditor from '../components/LayoutEditor.jsx';
import Avatar from '../components/Avatar.jsx';
import Spinner from '../components/Spinner.jsx';
import { CURRENCIES, GENDERS, IMAGE_TYPES, MAX_IMAGE_MB, VOICE_STYLES } from '../lib/constants.js';

function ImageUploadButton({ endpoint, label, onChange }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) return setErr('Use JPG, PNG or WebP');
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) return setErr(`Max ${MAX_IMAGE_MB}MB`);
    setBusy(true);
    setErr('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await api.post(endpoint, fd);
      onChange(data.profile);
    } catch (error) {
      setErr(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="btn-ghost bg-black/50 text-xs backdrop-blur">
        {busy ? 'Uploading…' : label}
      </button>
      <input ref={inputRef} type="file" accept={IMAGE_TYPES.join(',')} hidden onChange={onFile} />
      {err && <p className="mt-1 rounded bg-black/60 px-2 text-xs text-red-300">{err}</p>}
    </div>
  );
}

function DetailsForm({ profile, onChange }) {
  const [form, setForm] = useState({
    displayName: profile.displayName,
    bio: profile.bio ?? '',
    languages: profile.languages.join(', '),
    voiceStyles: profile.voiceStyles,
    gender: profile.gender ?? '',
    priceFrom: profile.priceFrom ?? '',
    currency: profile.currency,
  });
  const [status, setStatus] = useState({ saving: false, msg: '', error: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const toggleStyle = (s) =>
    setForm((f) => ({
      ...f,
      voiceStyles: f.voiceStyles.includes(s) ? f.voiceStyles.filter((x) => x !== s) : [...f.voiceStyles, s].slice(0, 10),
    }));

  const save = async (e) => {
    e.preventDefault();
    setStatus({ saving: true, msg: '', error: '' });
    try {
      const payload = {
        displayName: form.displayName.trim(),
        bio: form.bio.trim(),
        languages: form.languages.split(',').map((s) => s.trim()).filter(Boolean),
        voiceStyles: form.voiceStyles,
        gender: form.gender || null,
        priceFrom: form.priceFrom === '' ? null : Number(form.priceFrom),
        currency: form.currency,
      };
      const { data } = await api.put('/artists/me', payload);
      onChange(data.profile);
      setStatus({ saving: false, msg: 'Profile saved', error: '' });
    } catch (err) {
      setStatus({ saving: false, msg: '', error: getErrorMessage(err) });
    }
  };

  return (
    <form onSubmit={save} className="card space-y-4">
      <h2 className="text-xl font-bold">Profile details</h2>
      <div>
        <label className="label" htmlFor="displayName">Display name</label>
        <input id="displayName" className="input" required minLength={2} maxLength={60} value={form.displayName} onChange={set('displayName')} />
      </div>
      <div>
        <label className="label" htmlFor="bio">Bio</label>
        <textarea id="bio" className="input min-h-[110px]" maxLength={1000} value={form.bio} onChange={set('bio')} placeholder="Tell clients about your voice, experience and studio setup." />
        <p className="text-right text-xs text-zinc-500">{form.bio.length}/1000</p>
      </div>
      <div>
        <label className="label" htmlFor="languages">Languages (comma separated)</label>
        <input id="languages" className="input" value={form.languages} onChange={set('languages')} placeholder="English, Hindi, Spanish" />
      </div>
      <div>
        <span className="label">Voice styles</span>
        <div className="flex flex-wrap gap-2">
          {VOICE_STYLES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleStyle(s)}
              className={`rounded-full border px-3 py-1 text-sm ${form.voiceStyles.includes(s) ? 'border-violet-500 bg-violet-500/20 text-violet-200' : 'border-white/10 text-zinc-400 hover:text-white'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="gender">Gender</label>
          <select id="gender" className="input" value={form.gender} onChange={set('gender')}>
            <option value="">—</option>
            {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="price">Starting price</label>
          <input id="price" type="number" min={0} max={1000000} className="input" value={form.priceFrom} onChange={set('priceFrom')} />
        </div>
        <div>
          <label className="label" htmlFor="currency">Currency</label>
          <select id="currency" className="input" value={form.currency} onChange={set('currency')}>
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" className="btn-primary" disabled={status.saving}>{status.saving ? 'Saving…' : 'Save details'}</button>
        {status.msg && <span className="text-sm text-emerald-400">{status.msg}</span>}
        {status.error && <span className="text-sm text-red-400">{status.error}</span>}
      </div>
    </form>
  );
}

export default function ProfileEditor() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const { refresh } = useAuth();

  useEffect(() => {
    api.get('/artists/me')
      .then(({ data }) => setProfile(data.profile))
      .catch((e) => setError(getErrorMessage(e)));
  }, []);

  const handleProfile = (p) => {
    setProfile(p);
    refresh(); // keep navbar/user state (avatar, isComplete) in sync
  };

  if (error) return <p className="p-8 text-center text-red-400">{error}</p>;
  if (!profile) return <Spinner full />;

  const count = profile.samples.length;

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      {/* Completion banner */}
      <div className={`rounded-2xl border p-4 ${profile.isComplete ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-amber-500/30 bg-amber-500/10'}`}>
        {profile.isComplete ? (
          <p className="text-emerald-300">
            ✅ Your profile is live!{' '}
            <Link to={`/artists/${profile.id}`} className="font-semibold underline">View public profile</Link>
          </p>
        ) : (
          <>
            <p className="font-semibold text-amber-300">Profile incomplete — hidden from clients</p>
            <p className="text-sm text-amber-200/80">Upload all 3 voice samples to go live. ({count}/3 uploaded)</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/30">
              <div className="h-full bg-amber-400 transition-all" style={{ width: `${(count / 3) * 100}%` }} />
            </div>
          </>
        )}
      </div>

      {/* Cover + avatar */}
      <section className="overflow-hidden rounded-2xl border border-white/10">
        <div
          className="relative h-44 bg-cover bg-center sm:h-56"
          style={{ backgroundImage: profile.coverUrl ? `url(${profile.coverUrl})` : `linear-gradient(135deg, ${profile.layout?.themeColor ?? '#7c3aed'}, #111)` }}
        >
          <div className="absolute right-3 top-3">
            <ImageUploadButton endpoint="/artists/me/cover" label="Change cover" onChange={handleProfile} />
          </div>
        </div>
        <div className="flex items-end gap-4 bg-zinc-900/60 px-6 pb-5">
          <div className="-mt-12 rounded-full border-4 border-zinc-900">
            <Avatar src={profile.avatarUrl} name={profile.displayName} size={96} />
          </div>
          <ImageUploadButton endpoint="/artists/me/avatar" label="Change photo" onChange={handleProfile} />
        </div>
      </section>

      <DetailsForm profile={profile} onChange={handleProfile} />

      <section className="card space-y-4">
        <div>
          <h2 className="text-xl font-bold">Voice samples <span className="text-sm font-normal text-amber-300">(3 required)</span></h2>
          <p className="text-sm text-zinc-400">These appear in the client feed and on your profile.</p>
        </div>
        {[1, 2, 3].map((pos) => (
          <AudioUploader key={pos} position={pos} sample={profile.samples.find((s) => s.position === pos)} onChange={handleProfile} />
        ))}
      </section>

      <LayoutEditor layout={profile.layout} onSaved={handleProfile} />
    </main>
  );
}
