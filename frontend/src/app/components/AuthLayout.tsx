import React, { type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { LayoutDashboard, FileText, Briefcase, Sparkles, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
}

export function AuthLayout({ children, title }: AuthLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useApp();
  const displayName = user?.name ?? user?.email ?? 'User';
  const displayInitial = displayName.charAt(0).toUpperCase();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, mobileLabel: 'Dashboard' },
    { path: '/resumes', label: 'Resumes', icon: FileText, mobileLabel: 'Resumes' },
    { path: '/job-postings', label: 'Job Postings', icon: Briefcase, mobileLabel: 'Jobs' },
    { path: '/optimize', label: 'Optimize', icon: Sparkles, mobileLabel: 'Optimize' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <aside className="hidden md:block fixed left-0 top-0 h-full w-64 bg-white border-r border-border">
        <div className="p-6">
          <Link to="/dashboard" className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg"></div>
            <span className="font-heading text-xl text-foreground">Resume Optimizer</span>
          </Link>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive ? 'bg-primary text-white' : 'text-foreground hover:bg-secondary/30'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-border">
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-secondary/30 rounded-xl transition-all w-full"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="md:pl-64 pb-20 md:pb-0">
        <header className="bg-white border-b border-border px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl text-foreground">{title}</h1>
            {user && (
              <div className="flex items-center gap-3 px-4 py-2 bg-secondary/30 rounded-full">
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center">
                  {displayInitial}
                </div>
                <span className="text-foreground hidden sm:block">{displayName}</span>
              </div>
            )}
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border">
        <div className="grid grid-cols-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 py-3 transition-all ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs">{item.mobileLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
