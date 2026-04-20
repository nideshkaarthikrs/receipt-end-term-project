import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="chip bg-ink-100 text-ink-700">404</p>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Nothing here.</h1>
      <p className="mt-2 text-sm text-ink-500">
        This page doesn&apos;t exist, or the share link was revoked.
      </p>
      <Link to="/" className="btn-secondary mt-6">
        Go home
      </Link>
    </main>
  );
}
