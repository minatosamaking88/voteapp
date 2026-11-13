import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ApiError, apiRequest } from '../lib/api.js';

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
};

type AuthState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; user: User }
  | { status: 'error'; message: string };

type AuthContextValue = {
  state: AuthState;
  authenticate: (
    mode: 'login' | 'register',
    payload: Record<string, string>,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  retrySessionCheck: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    apiRequest<User>('/auth/me')
      .then((user) => {
        if (active) setState({ status: 'authenticated', user });
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) {
          setState({ status: 'anonymous' });
          return;
        }
        setState({
          status: 'error',
          message:
            'We could not check your session. Check your connection and try again.',
        });
      });

    return () => {
      active = false;
    };
  }, [retryCount]);

  async function authenticate(
    mode: 'login' | 'register',
    payload: Record<string, string>,
  ): Promise<void> {
    const result = await apiRequest<{ user: User }>(`/auth/${mode}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setState({ status: 'authenticated', user: result.user });
  }

  async function signOut(): Promise<void> {
    await apiRequest<void>('/auth/logout', { method: 'POST' });
    setState({ status: 'anonymous' });
  }

  const value = useMemo(
    () => ({
      state,
      authenticate,
      signOut,
      retrySessionCheck: () => setRetryCount((count) => count + 1),
    }),
    [state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
