import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useBook } from '../lib/book';
import { isSupabaseConfigured } from '../lib/supabase';

export function RequireAuth() {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (!isSupabaseConfigured) {
    // In dev, before .env.local is filled in, let the user keep browsing
    // mock-data screens so the visual review still works.
    return <Outlet />;
  }
  if (loading) return <Quiet />;
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

export function RequireBook() {
  const { caregiver, baby, loading } = useBook();
  if (!isSupabaseConfigured) return <Outlet />;
  if (loading) return <Quiet />;
  if (!caregiver || !baby) {
    return <Navigate to="/welcome" replace />;
  }
  return <Outlet />;
}

function Quiet() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--parchment)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 18,
          color: 'var(--ink-mute)',
        }}
      >
        a moment…
      </div>
    </div>
  );
}
