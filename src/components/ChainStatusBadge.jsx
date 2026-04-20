export default function ChainStatusBadge({ result }) {
  if (!result || result.status === 'pending') {
    return (
      <span className="chip bg-amber-50 text-amber-700" role="status">
        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" aria-hidden="true" />
        Verifying chain…
      </span>
    );
  }

  if (result.status === 'valid') {
    return (
      <span className="chip bg-emerald-50 text-emerald-700" role="status">
        <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
        Chain intact
      </span>
    );
  }

  return (
    <span className="chip bg-red-50 text-red-700" role="alert">
      <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
      Chain broken at entry #{result.brokenAtIndex + 1}
    </span>
  );
}
