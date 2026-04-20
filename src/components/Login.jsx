import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';

export default function Login() {
  const { user, loading, error, signInEmail, signUpEmail, signInGoogle, clearError } =
    useAuth();
  const location = useLocation();
  const redirectTo = location.state?.from ?? '/dashboard';

  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    clearError();
  }, [mode, clearError]);

  if (!loading && user) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await signInEmail(email, password);
      } else {
        await signUpEmail(email, password, displayName);
      }
    } catch {
      // error surfaced via context
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    try {
      await signInGoogle();
    } catch {
      // error surfaced via context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <Link
        to="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-700"
      >
        <img src="/receipt.svg" alt="" className="h-5 w-5" aria-hidden="true" />
        <span className="font-semibold tracking-tight">Receipt</span>
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight">
        {mode === 'signin' ? 'Welcome back' : 'Create your account'}
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        {mode === 'signin'
          ? 'Sign in to your proof-of-work logs.'
          : 'Start logging work in under a minute.'}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === 'signup' && (
          <div>
            <label htmlFor="displayName" className="mb-1 block text-sm font-medium">
              Display name
            </label>
            <input
              id="displayName"
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="input"
              placeholder="Nidesh Kaarthik"
              required
            />
          </div>
        )}
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="input"
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="input"
            placeholder="At least 6 characters"
            minLength={6}
            required
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-ink-400">
        <span className="h-px flex-1 bg-ink-200" />
        <span>or</span>
        <span className="h-px flex-1 bg-ink-200" />
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        className="btn-secondary w-full"
        disabled={submitting}
      >
        Continue with Google
      </button>

      <p className="mt-8 text-center text-sm text-ink-500">
        {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
        <button
          type="button"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="font-medium text-ink-900 underline-offset-2 hover:underline"
        >
          {mode === 'signin' ? 'Create one' : 'Sign in'}
        </button>
      </p>
    </main>
  );
}
