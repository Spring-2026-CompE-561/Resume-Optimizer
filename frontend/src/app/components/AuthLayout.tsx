import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Button } from './Button';
import { useApp } from '../context/AppContext';

type Props = { children: ReactNode };

export function AuthLayout({ children }: Props) {
  const navigate = useNavigate();
  const { logout, user } = useApp();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {user ? <span className="font-medium text-foreground">{user.email}</span> : null}
        </p>
        <Button type="button" variant="primary" onClick={handleLogout}>
          Log out
        </Button>
      </header>
      <div className="p-6">{children}</div>
    </div>
  );
}
