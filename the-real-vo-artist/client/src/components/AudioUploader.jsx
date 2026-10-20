import { useEffect, useRef, useState } from 'react';
import { api, getErrorMessage } from '../api/client.js';
import { AUDIO_EXT_RE, AUDIO_TYPES, MAX_AUDIO_MB } from '../lib/constants.js';

export default function AudioUploader({ position, sample, onChange }) {
  const [title, setTitle] = useState(sample?.title ?? '');
  const [description, setDescription] = useState(sample?.description ?? '');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    setTitle(sample?.title ?? '');
    setDescription(sample?.description ?? '');
  }, [sample?.id, sample?.title, sample?.description]);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!AUDIO_TYPES.includes(f.type) && !AUDIO_EXT_RE.test(f.name)) {
      return setError('Use MP3, WAV, M4A, AAC or OGG audio');
    }
    if (f.size > MAX_AUDIO_MB * 1024 * 1024) return setError(`Audio must be under ${MAX_AUDIO_MB}MB`);
    setError('');
    setOk('');
    setFile(f);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!sample && !file) return setError('Choose an audio file');
    setBusy(true);
    setError('');
    setOk('');
    setProgress(0);

    const fd = new FormData();
    fd.append('title', title.trim());
    fd.append('description', description.trim());
    if (file) fd.append('audio', file);

    try {
      const { data } = await api.put(`/artists/me/samples/${position}`, fd, {
        onUploadProgress: (ev) => ev.total && setProgress(Math.round((ev.loaded * 100) / ev.total)),
      });
      setFile(null);
      onChange(data.profile);
      setOk('Saved');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this sample? Your profile will be hidden until you have 3 samples.')) return;
    setBusy(true);
    try {
      const { data } = await api.delete(`/artists/me/samples/${position}`);
      onChange(data.profile);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Sample {position}</h3>
        <span className={`rounded-full px-2 py-0.5 text-xs ${sample ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
          {sample ? 'Uploaded' : 'Required'}
        </span>
      </div>

      <input className="input" placeholder="Title (e.g. Warm commercial read)" required minLength={2} maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="input min-h-[70px]" placeholder="Description (style, use case, tone)" required minLength={5} maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} />

      {(preview || sample?.url) && <audio controls src={preview || sample.url} className="w-full" preload="none" />}

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn-ghost" onClick={() => inputRef.current?.click()} disabled={busy}>
          {file ? `🎵 ${file.name.slice(0, 24)}` : sample ? 'Replace audio' : 'Choose audio'}
        </button>
        <input ref={inputRef} type="file" accept={[...AUDIO_TYPES, '.mp3,.wav,.m4a,.aac,.ogg'].join(',')} hidden onChange={pick} />
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? (progress > 0 && progress < 100 ? `Uploading ${progress}%` : 'Saving…') : 'Save sample'}
        </button>
        {sample && <button type="button" className="btn-danger" onClick={remove} disabled={busy}>Delete</button>}
      </div>

      {busy && progress > 0 && (
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-violet-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {ok && <p className="text-sm text-emerald-400">{ok}</p>}
      <p className="text-xs text-zinc-500">MP3, WAV, M4A, AAC or OGG · max {MAX_AUDIO_MB}MB · up to 5 minutes</p>
    </form>
  );
}
