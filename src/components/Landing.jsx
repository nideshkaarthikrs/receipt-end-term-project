import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';

export default function Landing() {
  const { user } = useAuth();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-between px-6 py-10">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/receipt.svg" alt="" className="h-7 w-7" aria-hidden="true" />
          <span className="text-lg font-semibold tracking-tight">Receipt</span>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          {user ? (
            <Link to="/dashboard" className="btn-secondary">
              Go to dashboard
            </Link>
          ) : (
            <Link to="/login" className="btn-secondary">
              Sign in
            </Link>
          )}
        </nav>
      </header>

      <section className="py-14">
        <p className="chip bg-emerald-50 text-emerald-700">
          Tamper-evident proof-of-work logs
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
          Keep receipts. Settle disputes in seconds.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-ink-600">
          Receipt is a dated, cryptographically chained record of every
          deliverable, message, and revision you exchange with a client. Share
          one link, and the timeline proves itself.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to={user ? '/dashboard' : '/login'} className="btn-primary">
            {user ? 'Open dashboard' : 'Try it now'}
          </Link>
          <a
            href="#how"
            className="btn-secondary"
          >
            How it works
          </a>
        </div>
      </section>

      <footer id="how" className="border-t border-ink-200 pt-6 text-sm text-ink-500">
        <p>
          Each entry is SHA-256 hashed with the hash of the entry before it.
          Edit anything, and the chain visibly breaks.
        </p>
      </footer>
    </main>
  );
}
