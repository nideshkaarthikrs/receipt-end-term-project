import { forwardRef, memo } from 'react';

const TYPE_STYLE = {
  deliverable: { label: 'Deliverable', dot: 'bg-emerald-500' },
  message: { label: 'Message', dot: 'bg-sky-500' },
  revision: { label: 'Revision', dot: 'bg-amber-500' },
};

function formatTime(date) {
  if (!date) return 'just now';
  return date.toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function shortHash(hex) {
  if (!hex) return '—';
  if (hex === 'GENESIS') return 'GENESIS';
  return `${hex.slice(0, 8)}…${hex.slice(-4)}`;
}

const TimelineEntry = forwardRef(function TimelineEntry(
  { entry, index, isBroken, references },
  ref,
) {
  const typeStyle = TYPE_STYLE[entry.type] ?? TYPE_STYLE.deliverable;
  const created = entry.created_at?.toDate?.() ?? null;

  return (
    <li ref={ref} className="relative pl-8">
      <span
        className={`absolute left-2 top-2 h-2.5 w-2.5 rounded-full ${typeStyle.dot} ring-4 ring-white`}
        aria-hidden="true"
      />
      <article
        className={`card ${isBroken ? 'border-red-300 bg-red-50' : ''}`}
        aria-labelledby={`entry-${entry.id}-content`}
      >
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono text-ink-400">#{index + 1}</span>
            <span className="chip bg-ink-100 text-ink-700">{typeStyle.label}</span>
            {isBroken && (
              <span className="chip bg-red-100 text-red-700">Tampered</span>
            )}
          </div>
          <time
            className="text-xs text-ink-500"
            dateTime={created?.toISOString()}
          >
            {formatTime(created)}
          </time>
        </header>

        <p
          id={`entry-${entry.id}-content`}
          className="mt-2 whitespace-pre-wrap text-sm text-ink-800"
        >
          {entry.content}
        </p>

        {entry.file_url && (
          <a
            href={entry.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm text-sky-700 hover:underline"
          >
            <span aria-hidden="true">↗</span> Open attached link
          </a>
        )}

        {entry.references_entry_id && references && (
          <p className="mt-2 text-xs text-ink-500">
            Revises:{' '}
            <span className="italic">
              {references.content?.slice(0, 80) ?? entry.references_entry_id}
            </span>
          </p>
        )}

        <footer className="mt-3 grid grid-cols-2 gap-2 border-t border-ink-100 pt-2 text-[11px] font-mono text-ink-500">
          <div>
            <span className="block uppercase tracking-wide text-ink-400">prev</span>
            {shortHash(entry.prev_hash)}
          </div>
          <div>
            <span className="block uppercase tracking-wide text-ink-400">self</span>
            {shortHash(entry.self_hash)}
          </div>
        </footer>
      </article>
    </li>
  );
});

export default memo(TimelineEntry);
