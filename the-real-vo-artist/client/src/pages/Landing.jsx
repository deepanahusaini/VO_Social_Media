import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <main className="flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center px-4 py-12">
      <h1 className="mb-3 text-center text-4xl font-extrabold tracking-tight md:text-6xl">
        Find the voice. <span className="text-violet-400">Be the voice.</span>
      </h1>
      <p className="mb-12 max-w-xl text-center text-zinc-400">
        The social platform where voice-over artists showcase their craft and clients discover the perfect voice.
      </p>

      <div className="grid w-full max-w-4xl gap-6 md:grid-cols-2">
        <Link
          to="/artist/auth"
          className="group rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-600/30 to-fuchsia-600/10 p-10 transition hover:-translate-y-1 hover:border-violet-400"
        >
          <div className="mb-6 text-6xl">🎤</div>
          <h2 className="mb-2 text-2xl font-bold">Yes, I am a Voice Over Artist</h2>
          <p className="text-zinc-400">Build your profile, upload samples, and get discovered by clients.</p>
          <span className="mt-6 inline-block font-semibold text-violet-300 group-hover:translate-x-1">Get started →</span>
        </Link>

        <Link
          to="/client/auth"
          className="group rounded-3xl border border-sky-500/30 bg-gradient-to-br from-sky-600/30 to-emerald-600/10 p-10 transition hover:-translate-y-1 hover:border-sky-400"
        >
          <div className="mb-6 text-6xl">🎧</div>
          <h2 className="mb-2 text-2xl font-bold">I am looking for a Voice Over Artist</h2>
          <p className="text-zinc-400">Swipe through voices, find your match, and send your script directly.</p>
          <span className="mt-6 inline-block font-semibold text-sky-300 group-hover:translate-x-1">Start listening →</span>
        </Link>
      </div>
    </main>
  );
}
