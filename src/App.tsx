import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/auth-context";
import { AuthProvider } from "./auth/auth-provider";
import { RequireAdmin, RequireUser } from "./auth/route-guards";
import { AppShell } from "./components/app-shell";
import { AdminPage } from "./pages/admin-page";
import { AuthPage } from "./pages/auth-page";
import { BoardPage } from "./pages/board-page";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route
              path="/"
              element={
                <RequireUser>
                  <BoardPage />
                </RequireUser>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminPage />
                </RequireAdmin>
              }
            />
            <Route path="/login" element={<LoginRoute />} />
            <Route path="/register" element={<RegisterRoute />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

function LoginRoute() {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <p className="px-6 py-12" role="status">
        Checking your session…
      </p>
    );
  return user ? <Navigate to="/" replace /> : <AuthPage mode="login" />;
}

function RegisterRoute() {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <p className="px-6 py-12" role="status">
        Checking your session…
      </p>
    );
  return user ? <Navigate to="/" replace /> : <AuthPage mode="register" />;
}

function NotFoundPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-heading text-3xl font-semibold">Page not found</h1>
      <p className="mt-3 text-muted-foreground">
        That page is not part of the feature board.
      </p>
    </section>
  );
}
