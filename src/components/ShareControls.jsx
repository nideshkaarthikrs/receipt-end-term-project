import { useEffect, useState } from 'react';
import { serverTimestamp, updateDoc } from 'firebase/firestore';
import { generateShareToken, projectDoc } from '../firebase.js';
import Modal from './Modal.jsx';

export default function ShareControls({ project, open, onClose }) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const url =
    project && !project.share_token_revoked_at
      ? `${window.location.origin}/share/${project.share_token}`
      : '';

  useEffect(() => {
    if (!copied) return undefined;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  const handleCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRevoke = async () => {
    if (!project) return;
    if (!confirm('Revoke the public share link? Anyone with the URL will lose access.')) return;
    setBusy(true);
    setError(null);
    try {
      await updateDoc(projectDoc(project.id), {
        share_token_revoked_at: serverTimestamp(),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRegenerate = async () => {
    if (!project) return;
    setBusy(true);
    setError(null);
    try {
      await updateDoc(projectDoc(project.id), {
        share_token: generateShareToken(),
        share_token_revoked_at: null,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Share this project">
      <div className="space-y-4">
        <p className="text-sm text-ink-600">
          Anyone with this link can view the read-only timeline and verify the
          chain. They cannot make any changes.
        </p>

        {url ? (
          <div className="flex items-stretch gap-2">
            <input
              type="text"
              value={url}
              readOnly
              className="input font-mono text-xs"
              onFocus={(e) => e.target.select()}
            />
            <button
              type="button"
              onClick={handleCopy}
              className="btn-secondary shrink-0"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        ) : (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            This project&apos;s share link is currently revoked. Generate a new
            one to share again.
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-2 border-t border-ink-200 pt-4">
          <button
            type="button"
            onClick={handleRegenerate}
            className="btn-secondary"
            disabled={busy}
          >
            {busy ? 'Working…' : url ? 'Regenerate token' : 'Generate new link'}
          </button>
          {url && (
            <button
              type="button"
              onClick={handleRevoke}
              className="btn-danger"
              disabled={busy}
            >
              Revoke link
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
