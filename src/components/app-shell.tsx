import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/auth-context";
import { errorMessage } from "../lib/api";

export function AppShell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [signOutError, setSignOutError] = useState("");

  async function handleSignOut() {
    setSignOutError("");
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      setSignOutError(errorMessage(error, "Could not sign out. Try again."));
    }
  }

  return (
    <>
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-primary focus:px-4 focus:py-3 focus:text-primary-foreground"
        href="#main-content"
      >
        Skip to content
      </a>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="font-heading text-lg font-semibold tracking-tight text-foreground"
          >
            Feature Board
          </Link>
          <nav
            className="flex flex-wrap items-center gap-2"
            aria-label="Main navigation"
          >
            {user ? (
              <>
                <NavLink to="/" end className={navClassName}>
                  Board
                </NavLink>
                {user.role === "ADMIN" && (
                  <NavLink to="/admin" className={navClassName}>
                    Admin
                  </NavLink>
                )}
                <span className="hidden text-sm text-muted-foreground sm:inline">
                  {user.name}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="min-h-11 rounded-control px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navClassName}>
                  Sign in
                </NavLink>
                <NavLink to="/register" className={navClassName}>
                  Create account
                </NavLink>
              </>
            )}
          </nav>
        </div>
        {signOutError && (
          <p
            className="mx-auto max-w-6xl px-4 pb-3 text-sm text-destructive sm:px-6"
            role="alert"
          >
            {signOutError}
          </p>
        )}
      </header>
      <main id="main-content" className="min-h-[calc(100vh-4rem)]">
        <Outlet />
      </main>
    </>
  );
}

function navClassName({ isActive }: { isActive: boolean }): string {
  return isActive
    ? "min-h-11 rounded-control border-l-2 border-primary bg-primary/10 px-3 py-2 text-sm font-semibold text-primary"
    : "min-h-11 rounded-control px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground";
}
