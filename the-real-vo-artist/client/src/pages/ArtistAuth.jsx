import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const initial = { displayName: '', email: '', phone: '', password: '', identifier: '' };

export default function ArtistAuth() {
  const [mode, setMode] = useState('signup');
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'ARTIST') navigate('/artist/profile/edit', { replace: true });
  }, [user, navigate]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload =
        mode === 'signup'
          ? { displayName: form.displayName, email: form.email, phone: form.phone, password: form.password }
          : { identifier: form.identifier, password: form.password };
      const { data } = await api.post(`/auth/artist/${mode}`, payload);
      setUser(data.user);
      navigate('/artist/profile/edit');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center px-4 py-10">
      <div className="card w-full max-w-md">
        <h1 className="mb-1 text-3xl font-extrabold">Welcome Artist</h1>
        <p className="mb-6 text-sm text-zinc-400">Your voice deserves a stage.</p>

        {user?.role === 'CLIENT' && (
          <p className="mb-4 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-300">
            You're signed in as a client. Log out first to use an artist account.
          </p>
        )}

        <div className="mb-6 grid grid-cols-2 rounded-xl bg-white/5 p-1">
          {['signup', 'login'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(''); }}
              className={`rounded-lg py-2 text-sm font-semibold ${mode === m ? 'bg-violet-600 text-white' : 'text-zinc-400'}`}
            >
              {m === 'signup' ? 'Sign Up' : 'Login'}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {mode === 'signup' ? (
            <>
              <div>
                <label className="label" htmlFor="displayName">Stage / display name</label>
                <input id="displayName" name="displayName" className="input" required minLength={2} maxLength={60} value={form.displayName} onChange={onChange} />
              </div>
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input id="email" name="email" type="email" autoComplete="email" className="input" required value={form.email} onChange={onChange} />
              </div>
              <div>
                <label className="label" htmlFor="phone">Mobile number</label>
                <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+14155552671" className="input" required value={form.phone} onChange={onChange} />
              </div>
            </>
          ) : (
            <div>
              <label className="label" htmlFor="identifier">Email or mobile number</label>
              <input id="identifier" name="identifier" autoComplete="username" className="input" required value={form.identifier} onChange={onChange} />
            </div>
          )}
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              className="input"
              required
              minLength={mode === 'signup' ? 8 : 1}
              maxLength={72}
              value={form.password}
              onChange={onChange}
            />
            {mode === 'signup' && <p className="mt-1 text-xs text-zinc-500">At least 8 characters, with a letter and a number.</p>}
          </div>

          {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Please wait…' : mode === 'signup' ? 'Create artist account' : 'Login'}
          </button>
        </form>
      </div>
    </main>
  );
}
