import { useState } from 'react';
import { AuthForm } from './AuthForm.js';
import type { AuthMode } from './useAuthForm.js';

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl items-center justify-center px-4 py-12 sm:px-8">
      <section className="w-full max-w-md animate-[fade-up_220ms_ease-out] motion-reduce:animate-none">
        <header className="mb-8 text-center">
          <p className="mb-3 text-lg font-semibold tracking-tight text-primary">
            FeatureVote
          </p>
          <h1 className="text-balance font-heading text-3xl font-semibold leading-9 tracking-tight">
            Access your feature board
          </h1>
          <p className="mt-3 text-base leading-6 text-muted-foreground">
            Log in or create an account to continue.
          </p>
        </header>

        <div className="rounded-container border border-border border-t-4 border-t-primary bg-card p-6 shadow-sm sm:p-8">
          <div
            className="mb-7 grid grid-cols-2 rounded-control bg-muted p-1"
            role="group"
            aria-label="Account access"
          >
            <button
              id="login-tab"
              className={`min-h-11 rounded-control px-3 font-medium transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${mode === 'login' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              type="button"
              aria-pressed={mode === 'login'}
              onClick={() => setMode('login')}
            >
              Log in
            </button>
            <button
              id="register-tab"
              className={`min-h-11 rounded-control px-3 font-medium transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${mode === 'register' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              type="button"
              aria-pressed={mode === 'register'}
              onClick={() => setMode('register')}
            >
              Register
            </button>
          </div>

          <div id="account-form">
            <h2 className="mb-1 text-xl font-semibold tracking-tight">
              {mode === 'register' ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="mb-6 text-base leading-6 text-muted-foreground">
              {mode === 'register'
                ? 'Use your work name and email to get started.'
                : 'Enter your email and password to continue.'}
            </p>
            <AuthForm mode={mode} />
          </div>
        </div>
      </section>
    </main>
  );
}
