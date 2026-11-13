import { useEffect, useState } from "react";
import type { PublicUser } from "@featurevote/shared/contracts";
import { ApiClientError, requestJson } from "./api";
import { AppShell } from "./AppShell";
import { AuthPage } from "./AuthPage";
import { FeatureBoard } from "./FeatureBoard";
import { NewFeaturePage } from "./NewFeaturePage";

type SessionState = {
  user: PublicUser | null;
  loading: boolean;
  error: string;
};

function ProtectedApp() {
  const [session, setSession] = useState<SessionState>({
    user: null,
    loading: true,
    error: "",
  });

  useEffect(() => {
    const controller = new AbortController();
    void requestJson<{ user: PublicUser }>("/api/auth/session", {
      signal: controller.signal,
    })
      .then(({ user }) => setSession({ user, loading: false, error: "" }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiClientError && error.status === 401) {
          window.location.replace("/login");
          return;
        }
        setSession({
          user: null,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Could not check your session.",
        });
      });
    return () => controller.abort();
  }, []);

  if (session.loading || !session.user) {
    return (
      <main
        className="session-state"
        role={session.loading ? "status" : undefined}
      >
        {session.loading ? (
          <p>Checking your session…</p>
        ) : (
          <div className="empty-state">
            <h1>We could not load your account</h1>
            <p>{session.error}</p>
            <button
              className="button button-primary"
              type="button"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}
      </main>
    );
  }

  const pathname = window.location.pathname;
  const content =
    pathname === "/features/new" ? (
      <NewFeaturePage />
    ) : (
      <FeatureBoard
        key={window.location.search}
        search={window.location.search}
      />
    );

  return <AppShell user={session.user}>{content}</AppShell>;
}

export default function App() {
  const pathname = window.location.pathname;
  if (pathname === "/login") return <AuthPage mode="login" />;
  if (pathname === "/register") return <AuthPage mode="register" />;
  return <ProtectedApp />;
}
