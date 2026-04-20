export default function LoadingScreen({ label = 'Loading' }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center bg-ink-50"
    >
      <div className="flex flex-col items-center gap-3 text-ink-500">
        <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-ink-300 border-t-ink-700" />
        <p className="text-sm">{label}…</p>
      </div>
    </div>
  );
}
