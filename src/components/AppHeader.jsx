import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';

export default function AppHeader() {
  const { user, signOut } = useAuth();

  return (
    <header className="border-b border-ink-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src="/receipt.svg" alt="" className="h-6 w-6" aria-hidden="true" />
          <span className="text-base font-semibold tracking-tight">Receipt</span>
        </Link>
        <div className="flex items-center gap-3 text-sm">
          {user && (
            <>
              <span className="hidden text-ink-500 sm:inline">
                {user.displayName || user.email}
              </span>
              <button type="button" onClick={signOut} className="btn-secondary">
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
