import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.js';
import { ApiError } from '../lib/api.js';

export function FeatureBoard() {
  const { state, signOut } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function logOut(): Promise<void> {
    setPending(true);
    setError('');
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : 'Could not log out. Try again.',
      );
    } finally {
      setPending(false);
    }
  }

  const userName = state.status === 'authenticated' ? state.user.name : '';

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-8">
          <Link
            className="text-lg font-semibold tracking-tight text-primary"
            to="/features"
          >
            FeatureVote
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-base text-muted-foreground sm:inline">
              {userName}
            </span>
            <button
              className="min-h-11 rounded-control border border-border bg-card px-4 font-medium transition hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60"
              type="button"
              disabled={pending}
              onClick={() => void logOut()}
            >
              {pending ? 'Logging out…' : 'Log out'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-8 sm:py-16">
        {error && (
          <p
            className="mb-6 rounded-control border border-destructive/30 bg-destructive/5 p-4 text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}
        <section className="rounded-container border border-border bg-card p-6 sm:p-8">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Feature board
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-6 text-muted-foreground">
            Feature requests and voting will be available here in the next story.
          </p>
        </section>
      </main>
    </div>
  );
}
