import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthPage } from './auth/AuthPage.js';
import { AuthProvider, useAuth } from './auth/AuthContext.js';
import { SessionState } from './auth/SessionState.js';
import { FeatureBoard } from './features/FeatureBoard.js';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/features" element={<ProtectedFeatureRoute />} />
          <Route path="*" element={<Navigate to="/features" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function LoginRoute() {
  const { state, retrySessionCheck } = useAuth();
  if (state.status === 'loading')
    return <SessionState message="Checking your session…" />;
  if (state.status === 'error') {
    return <SessionState message={state.message} onRetry={retrySessionCheck} />;
  }
  if (state.status === 'authenticated') return <Navigate to="/features" replace />;
  return <AuthPage />;
}

function ProtectedFeatureRoute() {
  const { state, retrySessionCheck } = useAuth();
  if (state.status === 'loading')
    return <SessionState message="Checking your session…" />;
  if (state.status === 'error') {
    return <SessionState message={state.message} onRetry={retrySessionCheck} />;
  }
  if (state.status === 'anonymous') return <Navigate to="/login" replace />;
  return <FeatureBoard />;
}
