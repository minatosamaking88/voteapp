import { useState, type ReactNode } from "react";
import type { PublicUser } from "@featurevote/shared/contracts";
import { ApiClientError, requestJson } from "./api";

type AppShellProps = {
  user: PublicUser;
  children: ReactNode;
};

export function AppShell({ user, children }: AppShellProps) {
  const [logoutError, setLogoutError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    setLogoutError("");
    try {
      await requestJson<{ ok: true }>("/api/auth/session", {
        method: "DELETE",
      });
      window.location.assign("/login");
    } catch (error) {
      setLogoutError(
        error instanceof ApiClientError
          ? error.message
          : "Could not sign out. Check your connection and try again.",
      );
      setLoggingOut(false);
    }
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <a className="brand" href="/features">
          FeatureVote
        </a>
        <nav className="site-nav" aria-label="Main navigation">
          <a href="/features" aria-current="page">
            Features
          </a>
        </nav>
        <div className="account-menu">
          <span className="account-name">{user.name}</span>
          <button
            className="button button-quiet"
            type="button"
            onClick={logout}
            disabled={loggingOut}
          >
            {loggingOut ? "Signing out…" : "Log out"}
          </button>
        </div>
      </header>
      {logoutError && (
        <p className="inline-error" role="alert">
          {logoutError}
        </p>
      )}
      <main id="main-content" className="main-content">
        {children}
      </main>
    </div>
  );
}
