"use client";

import type { ReactNode } from "react";
import { useEffect, useEffectEvent, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Clock3,
  FileText,
  LayoutGrid,
  Loader2,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Target,
} from "lucide-react";
import { toast } from "sonner";

import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import {
  clearStoredSession,
  readAccessToken,
  readStoredUser,
  updateStoredUser,
} from "@/lib/auth-storage";
import { clearDashboardCache, loadCurrentUser } from "@/lib/dashboard-cache";
import { logout } from "@/lib/api";
import type { AuthUser } from "@/lib/types";
import {
  readSidebarCollapsedPreference,
  writeSidebarCollapsedPreference,
} from "@/lib/ui-preferences";
import { getDisplayName, getInitials } from "@/lib/user-display";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/dashboard",
    icon: LayoutGrid,
    isActive: (pathname: string) =>
      pathname === "/dashboard" ||
      pathname.startsWith("/dashboard/workflow") ||
      pathname.startsWith("/dashboard/results"),
    label: "Workspace",
  },
  {
    href: "/dashboard/resumes",
    icon: FileText,
    isActive: (pathname: string) => pathname.startsWith("/dashboard/resumes"),
    label: "Resumes",
  },
  {
    href: "/dashboard/jobs",
    icon: Target,
    isActive: (pathname: string) => pathname.startsWith("/dashboard/jobs"),
    label: "Roles",
  },
  {
    href: "/dashboard/history",
    icon: Clock3,
    isActive: (pathname: string) => pathname.startsWith("/dashboard/history"),
    label: "History",
  },
  {
    href: "/dashboard/settings",
    icon: Settings,
    isActive: (pathname: string) => pathname.startsWith("/dashboard/settings"),
    label: "Settings",
  },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPending, startTransition] = useTransition();

  const syncUser = useEffectEvent(async () => {
    const nextUser = await loadCurrentUser();
    updateStoredUser(nextUser);
    setUser(nextUser);
  });

  useEffect(() => {
    setSidebarCollapsed(readSidebarCollapsedPreference());

    if (!readAccessToken()) {
      router.replace("/auth?mode=signin");
      return;
    }

    let cancelled = false;

    async function bootstrap() {
      try {
        const storedUser = readStoredUser();
        if (storedUser && !cancelled) {
          setUser(storedUser);
        }
        await syncUser();
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Unable to load your account.";
          toast.error(message);
          clearDashboardCache();
          clearStoredSession();
          router.replace("/auth?mode=signin");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [router]);

  function handleLogout() {
    startTransition(async () => {
      clearDashboardCache();
      await logout();
      router.replace("/auth?mode=signin");
    });
  }

  function handleToggleSidebar() {
    setSidebarCollapsed((current) => {
      const next = !current;
      writeSidebarCollapsedPreference(next);
      return next;
    });
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3 shadow-[0_20px_60px_var(--card-shadow)]">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm font-medium tracking-[-0.03em] text-muted-foreground">
            Loading your workspace...
          </span>
        </div>
      </div>
    );
  }

  const displayName = getDisplayName(user);
  const initials = getInitials(user);

  return (
    <main className="min-h-screen">
      <div
        className={cn(
          "grid min-h-screen transition-[grid-template-columns] duration-200",
          sidebarCollapsed
            ? "lg:grid-cols-[92px_minmax(0,1fr)]"
            : "lg:grid-cols-[268px_minmax(0,1fr)]",
        )}
      >
        <aside
          className={cn(
            "hidden border-r border-border bg-[var(--sidebar-surface)] py-8 backdrop-blur-sm lg:flex lg:flex-col",
            sidebarCollapsed ? "items-center px-3" : "px-5",
          )}
        >
          <div className={cn("flex w-full items-center", sidebarCollapsed ? "justify-center" : "justify-between")}>
            <AppLogo
              href="/dashboard"
              className={cn(!sidebarCollapsed && "px-2")}
              showText={!sidebarCollapsed}
            />
            {!sidebarCollapsed ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
                onClick={handleToggleSidebar}
                className="h-10 w-10 px-0"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            ) : null}
          </div>

          {sidebarCollapsed ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Expand sidebar"
              title="Expand sidebar"
              onClick={handleToggleSidebar}
              className="mt-6 h-10 w-10 px-0"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          ) : null}

          <nav aria-label="Primary" className={cn("space-y-2", sidebarCollapsed ? "mt-6" : "mt-12")}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.isActive(pathname);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={sidebarCollapsed ? item.label : undefined}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={cn(
                    "group relative flex items-center gap-4 rounded-[18px] text-lg font-medium tracking-[-0.04em] transition",
                    sidebarCollapsed ? "h-12 w-12 justify-center px-0 py-0" : "px-5 py-4",
                    active
                      ? "bg-accent text-primary"
                      : "text-foreground hover:bg-card hover:shadow-[0_12px_30px_var(--soft-shadow)]",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className={cn(sidebarCollapsed && "sr-only")}>{item.label}</span>
                  {sidebarCollapsed ? (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-full top-1/2 z-30 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground opacity-0 shadow-[0_14px_34px_var(--card-shadow)] transition group-hover:opacity-100 group-focus-visible:opacity-100"
                    >
                      {item.label}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-border bg-[var(--header-surface)] backdrop-blur-xl">
            <div className="flex min-h-[92px] items-center justify-between gap-6 px-6 lg:px-10">
              <div className="lg:hidden">
                <AppLogo href="/dashboard" />
              </div>

              <div className="ml-auto flex items-center gap-5">
                <div className="hidden h-12 w-px bg-border md:block" />
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-base font-semibold text-primary">
                    {initials}
                  </div>
                  <div className="hidden min-w-0 md:block">
                    <p className="truncate text-lg font-semibold tracking-[-0.04em] text-foreground">
                      {displayName}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <div className="hidden h-12 w-px bg-border md:block" />
                <Button variant="ghost" onClick={handleLogout} disabled={isPending}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto border-t border-border px-6 py-3 lg:hidden">
              <div className="flex min-w-max gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = item.isActive(pathname);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium tracking-[-0.03em] transition",
                        active ? "bg-accent text-primary" : "bg-card text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </header>

          <section className="px-6 py-8 lg:px-10 lg:py-10">{children}</section>
        </div>
      </div>
    </main>
  );
}
