import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';

type Props = { children: React.ReactNode };

export function ProtectedRoute({ children }: Props) {
  const { isAuthenticated, sessionReady } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionReady) {
      return;
    }
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [sessionReady, isAuthenticated, navigate]);

  if (!sessionReady) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-background"
        role="status"
      >
        <p className="text-muted-foreground">Loading session…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
