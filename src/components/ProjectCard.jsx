import { Link } from 'react-router-dom';

function formatRelative(date) {
  if (!date) return 'just now';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export default function ProjectCard({ project }) {
  const created = project.created_at?.toDate?.() ?? null;

  return (
    <Link
      to={`/projects/${project.id}`}
      className="card flex flex-col gap-2 transition hover:border-ink-400 hover:shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-ink-900">
            {project.name}
          </h3>
          <p className="truncate text-sm text-ink-500">{project.client_name}</p>
        </div>
        {project.share_token_revoked_at ? (
          <span className="chip bg-ink-100 text-ink-600">private</span>
        ) : (
          <span className="chip bg-emerald-50 text-emerald-700">shareable</span>
        )}
      </div>
      {project.scope && (
        <p className="line-clamp-2 text-sm text-ink-600">{project.scope}</p>
      )}
      <div className="mt-auto flex items-center justify-between pt-2 text-xs text-ink-500">
        <span>Created {formatRelative(created)}</span>
        {project.rate ? <span>₹{project.rate}/session</span> : null}
      </div>
    </Link>
  );
}
