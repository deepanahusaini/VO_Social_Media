import { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../api/client.js';

export default function OtpVerify({ phone, onVerified, onBack }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const verify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/client/otp/verify', { phone, code });
      onVerified(data.user, data.isNew);
    } catch (err) {
      setError(getErrorMessage(err));
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError('');
    setInfo('');
    try {
      await api.post('/auth/client/otp/send', { phone });
      setCooldown(60);
      setCode('');
      setInfo('A new code has been sent.');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <form onSubmit={verify} className="space-y-5">
      <p className="text-sm text-zinc-400">
        Enter the 6-digit code sent to <span className="font-semibold text-white">{phone}</span>. It expires in 5 minutes.
      </p>
      <input
        className="input text-center text-2xl tracking-[0.5em]"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        maxLength={6}
        pattern="\d{6}"
        required
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        aria-label="Verification code"
      />
      {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
      {info && <p className="text-sm text-emerald-400">{info}</p>}

      <button type="submit" disabled={loading || code.length !== 6} className="btn-primary w-full">
        {loading ? 'Verifying…' : 'Verify & continue'}
      </button>

      <div className="flex items-center justify-between text-sm">
        <button type="button" onClick={onBack} className="text-zinc-400 hover:text-white">← Change number</button>
        <button type="button" onClick={resend} disabled={cooldown > 0} className="text-violet-300 disabled:text-zinc-600">
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
      </div>
    </form>
  );
}
