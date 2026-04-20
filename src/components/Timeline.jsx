import { useEffect, useMemo, useRef } from 'react';
import TimelineEntry from './TimelineEntry.jsx';

function dateKey(date) {
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

export default function Timeline({ entries, chainResult, scrollToLatestId }) {
  const refMap = useRef(new Map());

  // Reverse-chronological grouping by calendar day, memoized so reordering
  // only happens when the entries array changes.
  const grouped = useMemo(() => {
    const buckets = new Map();
    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i];
      const date = entry.created_at?.toDate?.();
      const key = date ? dateKey(date) : 'Pending';
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push({ entry, index: i });
    }
    // Each bucket sorted desc; keys ordered by the latest entry in each.
    const ordered = [...buckets.entries()].sort((a, b) => {
      const aLast = a[1][a[1].length - 1].entry.created_at?.toDate?.()?.getTime() ?? 0;
      const bLast = b[1][b[1].length - 1].entry.created_at?.toDate?.()?.getTime() ?? 0;
      return bLast - aLast;
    });
    return ordered.map(([day, items]) => ({
      day,
      items: items.slice().reverse(),
    }));
  }, [entries]);

  const referencesById = useMemo(() => {
    const map = new Map();
    for (const e of entries) map.set(e.id, e);
    return map;
  }, [entries]);

  // Scroll a freshly-created entry into view when its id changes.
  useEffect(() => {
    if (!scrollToLatestId) return;
    const node = refMap.current.get(scrollToLatestId);
    node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [scrollToLatestId]);

  if (entries.length === 0) {
    return (
      <div className="mt-6 rounded-lg border border-dashed border-ink-300 bg-white p-10 text-center">
        <p className="text-base text-ink-700">No entries yet.</p>
        <p className="mt-1 text-sm text-ink-500">
          Add the first entry — it will anchor the chain at GENESIS.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-8">
      {grouped.map(({ day, items }) => (
        <section key={day}>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-500">
            {day}
          </h3>
          <ul className="timeline-rail space-y-4">
            {items.map(({ entry, index }) => (
              <TimelineEntry
                key={entry.id}
                ref={(node) => {
                  if (node) refMap.current.set(entry.id, node);
                  else refMap.current.delete(entry.id);
                }}
                entry={entry}
                index={index}
                isBroken={
                  chainResult?.status === 'broken' &&
                  chainResult.brokenAtIndex === index
                }
                references={
                  entry.references_entry_id
                    ? referencesById.get(entry.references_entry_id)
                    : null
                }
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
