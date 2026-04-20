import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { db, findProjectByShareToken } from '../firebase.js';
import ChainStatusBadge from './ChainStatusBadge.jsx';
import Timeline from './Timeline.jsx';
import useHashChain from '../hooks/useHashChain.js';
import useShareViews from '../hooks/useShareViews.js';

export default function SharePage() {
  const { token } = useParams();
  const [project, setProject] = useState(null);
  const [entries, setEntries] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const chainResult = useHashChain(entries);
  useShareViews(project?.id);

  useEffect(() => {
    let unsubscribeEntries = null;
    let cancelled = false;

    async function loadProject() {
      setStatus('loading');
      try {
        const found = await findProjectByShareToken(token);
        if (cancelled) return;

        if (!found) {
          setStatus('revoked');
          return;
        }

        setProject(found);
        setStatus('ready');

        const q = query(
          collection(db, 'projects', found.id, 'entries'),
          orderBy('created_at', 'asc'),
        );
        unsubscribeEntries = onSnapshot(
          q,
          (snap) => {
            setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          },
          (err) => setError(err.message),
        );
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setStatus('error');
        }
      }
    }

    loadProject();
    return () => {
      cancelled = true;
      if (unsubscribeEntries) unsubscribeEntries();
    };
  }, [token]);

  if (status === 'loading') {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm text-ink-500" role="status">
          Loading shared timeline…
        </p>
      </main>
    );
  }

  if (status === 'revoked' || (status === 'error' && !project)) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="chip bg-ink-100 text-ink-700">Link unavailable</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          This share link is no longer active.
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          {error ??
            'The owner has revoked the link, or the URL is incorrect. Ask them for a fresh one.'}
        </p>
        <Link to="/" className="btn-secondary mt-6">
          About Receipt
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/receipt.svg" alt="" className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-semibold tracking-tight">Receipt</span>
        </Link>
        <span className="chip bg-ink-100 text-ink-600">Read-only</span>
      </div>

      <header className="mt-8">
        <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
        <p className="mt-1 text-sm text-ink-500">
          Shared by the project owner · timeline of every logged deliverable,
          message, and revision.
        </p>
        <div className="mt-3">
          <ChainStatusBadge result={chainResult} />
        </div>
      </header>

      {project.scope && (
        <p className="mt-4 rounded-md bg-ink-100 p-3 text-sm text-ink-700">
          {project.scope}
        </p>
      )}

      <Timeline entries={entries} chainResult={chainResult} />

      <footer className="mt-12 border-t border-ink-200 pt-4 text-xs text-ink-500">
        <p>
          Each entry is SHA-256 hashed with the previous entry&apos;s hash. If
          any entry were edited after the fact, this page would show a red
          &quot;chain broken&quot; badge above. Verify yourself — the
          computation runs in your browser.
        </p>
      </footer>
    </main>
  );
}
