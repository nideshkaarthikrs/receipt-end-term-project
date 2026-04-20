import { useEffect, useMemo, useState } from 'react';
import { computeEntryHash } from '../firebase.js';

// useHashChain takes the same entries array passed to <Timeline /> and
// re-derives the chain to confirm no entry has been tampered with. It returns
// either { status: 'pending' }, { status: 'valid' }, or
// { status: 'broken', brokenAtIndex }.
//
// useMemo wraps the (entries → fingerprint) projection so the verifier doesn't
// re-run on every parent re-render. SHA-256 is fast but with hundreds of
// entries it would still cost real frame time.
export default function useHashChain(entries) {
  // Stable fingerprint of the inputs that participate in the hash. Two arrays
  // with the same fingerprint are guaranteed to verify identically, so we can
  // skip work when only e.g. UI state changes.
  const fingerprint = useMemo(
    () =>
      entries
        .map(
          (e) =>
            `${e.id}|${e.self_hash ?? ''}|${e.prev_hash ?? ''}|${e.created_at?.seconds ?? ''}|${e.type}|${e.content}|${e.file_sha256 ?? ''}`,
        )
        .join('\n'),
    [entries],
  );

  const [result, setResult] = useState({ status: 'pending' });

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      // Anything still pending a self_hash counts as in-flight, not broken.
      if (entries.length === 0) {
        if (!cancelled) setResult({ status: 'valid' });
        return;
      }

      let prevHash = 'GENESIS';
      for (let i = 0; i < entries.length; i += 1) {
        const entry = entries[i];

        if (!entry.self_hash || !entry.created_at?.toDate) {
          if (!cancelled) setResult({ status: 'pending', pendingAtIndex: i });
          return;
        }

        if (entry.prev_hash !== prevHash) {
          if (!cancelled) {
            setResult({ status: 'broken', brokenAtIndex: i, reason: 'prev_hash mismatch' });
          }
          return;
        }

        const expected = await computeEntryHash({
          id: entry.id,
          type: entry.type,
          content: entry.content,
          file_sha256: entry.file_sha256 ?? null,
          created_at_iso: entry.created_at.toDate().toISOString(),
          prev_hash: entry.prev_hash,
        });

        if (expected !== entry.self_hash) {
          if (!cancelled) {
            setResult({ status: 'broken', brokenAtIndex: i, reason: 'self_hash mismatch' });
          }
          return;
        }

        prevHash = entry.self_hash;
      }

      if (!cancelled) setResult({ status: 'valid' });
    }

    verify();
    return () => {
      cancelled = true;
    };
    // fingerprint intentionally — it's the memoized projection of entries.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fingerprint]);

  return result;
}
