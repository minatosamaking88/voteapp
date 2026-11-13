import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "./auth-context";

export function RequireUser({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <p className="mx-auto max-w-6xl px-6 py-12" role="status">
        Checking your session…
      </p>
    );
  return user ? children : <Navigate to="/login" replace />;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <p className="mx-auto max-w-6xl px-6 py-12" role="status">
        Checking your session…
      </p>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "ADMIN") {
    return (
      <section
        className="mx-auto max-w-3xl px-6 py-16"
        aria-labelledby="access-denied-title"
      >
        <p className="text-sm font-semibold text-destructive">
          403 · Access denied
        </p>
        <h1
          id="access-denied-title"
          className="mt-3 font-heading text-3xl font-semibold text-foreground"
        >
          Administrator access is required
        </h1>
        <p className="mt-3 text-muted-foreground">
          Your account can use the feature board, but it cannot manage request
          status.
        </p>
      </section>
    );
  }
  return children;
}
