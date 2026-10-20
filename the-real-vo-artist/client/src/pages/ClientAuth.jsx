import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api, getErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import OtpVerify from '../components/OtpVerify.jsx';

export default function ClientAuth() {
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/feed';

  useEffect(() => {
    if (user?.role === 'CLIENT') navigate(from, { replace: true });
  }, [user, from, navigate]);

  const sendCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const normalized = phone.replace(/[\s()-]/g, '');
    try {
      await api.post('/auth/client/otp/send', { phone: normalized });
      setPhone(normalized);
      setStep('otp');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center px-4 py-10">
      <div className="card w-full max-w-md">
        <h1 className="mb-1 text-3xl font-extrabold">Find your voice</h1>
        <p className="mb-6 text-sm text-zinc-400">Sign up or log in with your mobile number — no password needed.</p>

        {user?.role === 'ARTIST' && (
          <p className="mb-4 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-300">
            You're signed in as an artist. Log out first to use a client account.
          </p>
        )}

        {step === 'phone' ? (
          <form onSubmit={sendCode} className="space-y-4">
            <div>
              <label className="label" htmlFor="phone">Mobile number</label>
              <input id="phone" type="tel" autoComplete="tel" placeholder="+14155552671" className="input" required value={phone} onChange={(e) => setPhone(e.target.value)} />
              <p className="mt-1 text-xs text-zinc-500">Include your country code.</p>
            </div>
            {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Sending…' : 'Send verification code'}
            </button>
          </form>
        ) : (
          <OtpVerify
            phone={phone}
            onBack={() => setStep('phone')}
            onVerified={(u) => {
              setUser(u);
              navigate(from, { replace: true });
            }}
          />
        )}
      </div>
    </main>
  );
}
