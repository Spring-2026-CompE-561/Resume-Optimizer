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
  const [isPending, startTransition] = useTransition();

  const syncUser = useEffectEvent(async () => {
    const nextUser = await loadCurrentUser();
    updateStoredUser(nextUser);
    setUser(nextUser);
  });

  useEffect(() => {
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="flex items-center gap-3 rounded-full border border-white bg-white px-5 py-3 shadow-[0_20px_60px_rgba(20,37,84,0.1)]">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm font-medium tracking-[-0.03em] text-muted-foreground">
            Loading your workspace...
          </span>
        </div>
      </div>
    );
  }

  const displayName = user?.name || "Jordan Lee";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <main className="min-h-screen">
      <div className="grid min-h-screen lg:grid-cols-[268px_minmax(0,1fr)]">
        <aside className="hidden border-r border-white/80 bg-white/50 px-5 py-8 backdrop-blur-sm lg:flex lg:flex-col">
          <AppLogo href="/dashboard" className="px-2" />

          <nav className="mt-12 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.isActive(pathname);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-4 rounded-[18px] px-5 py-4 text-lg font-medium tracking-[-0.04em] transition",
                    active
                      ? "bg-accent text-primary"
                      : "text-foreground hover:bg-white hover:shadow-[0_12px_30px_rgba(20,37,84,0.06)]",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-white/80 bg-background/88 backdrop-blur-xl">
            <div className="flex min-h-[92px] items-center justify-between gap-6 px-6 lg:px-10">
              <div className="lg:hidden">
                <AppLogo href="/dashboard" />
              </div>

              <div className="ml-auto flex items-center gap-5">
                <div className="hidden h-12 w-px bg-border md:block" />
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-base font-semibold text-primary">
                    {initials || "JL"}
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

            <div className="overflow-x-auto border-t border-white/60 px-6 py-3 lg:hidden">
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
                        active ? "bg-accent text-primary" : "bg-white text-foreground",
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
