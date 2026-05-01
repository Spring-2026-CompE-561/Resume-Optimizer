"use client";

import type { ComponentType } from "react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, FileText, Loader2, LogOut, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { readAccessToken, readStoredUser } from "@/lib/auth-storage";
import { fetchJobPostings, fetchMe, fetchOptimizations, fetchResumes, logout } from "@/lib/api";
import type { AuthUser } from "@/lib/types";

interface DashboardSnapshot {
  user: AuthUser;
  resumeCount: number;
  jobPostingCount: number;
  optimizationCount: number;
}

export function DashboardShell() {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const greeting = useMemo(() => {
    const storedUser = snapshot?.user ?? readStoredUser();
    return storedUser?.name || storedUser?.email || "Operator";
  }, [snapshot]);

  useEffect(() => {
    if (!readAccessToken()) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    async function loadSnapshot() {
      try {
        const [user, resumes, jobPostings, optimizations] = await Promise.all([
          fetchMe(),
          fetchResumes(),
          fetchJobPostings(),
          fetchOptimizations(),
        ]);

        if (cancelled) {
          return;
        }

        setSnapshot({
          user,
          resumeCount: resumes.length,
          jobPostingCount: jobPostings.length,
          optimizationCount: optimizations.length,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to load dashboard data.";
        toast.error(message);
        router.replace("/login");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSnapshot();

    return () => {
      cancelled = true;
    };
  }, [router]);

  function handleLogout() {
    startTransition(async () => {
      await logout();
      router.replace("/login");
    });
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border border-border bg-white/80 px-5 py-3 shadow-spotlight">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Connecting to the backend...</span>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Badge>Authenticated workspace</Badge>
          <h1 className="text-4xl font-semibold tracking-[-0.04em]">Welcome back, {greeting}</h1>
          <p className="text-muted-foreground">
            Patch 2 wires the dashboard to live backend counts. Patch 3 fills in the
            optimization workspace.
          </p>
        </div>

        <Button variant="secondary" onClick={handleLogout} disabled={isPending}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Resumes"
          value={snapshot?.resumeCount ?? 0}
          description="Uploaded resume assets currently stored by the API."
          icon={FileText}
        />
        <MetricCard
          title="Job postings"
          value={snapshot?.jobPostingCount ?? 0}
          description="Tracked job descriptions available for alignment."
          icon={BriefcaseBusiness}
        />
        <MetricCard
          title="Optimizations"
          value={snapshot?.optimizationCount ?? 0}
          description="Optimization runs saved for review and regeneration."
          icon={Sparkles}
        />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-5">
          <div>
            <CardTitle className="mb-2">Backend connection confirmed</CardTitle>
            <CardDescription>
              The dashboard successfully fetched the current session, resumes, job postings, and
              optimization history from FastAPI.
            </CardDescription>
          </div>
          <Separator />
          <div className="grid gap-4 md:grid-cols-2">
            <StatusNote
              title="Auth flow"
              detail="Login, refresh-aware fetches, and logout are implemented against the backend API."
            />
            <StatusNote
              title="Next stage"
              detail="Resume upload, job description entry, and optimization controls are the next patch boundary."
            />
          </div>
        </Card>

        <Card className="bg-slate-950 text-white">
          <CardTitle className="mb-3 text-white">What comes next</CardTitle>
          <CardDescription className="text-slate-300">
            The optimization workspace will add the actual upload and generation controls while
            preserving this auth and data-loading foundation.
          </CardDescription>
          <div className="mt-8 flex items-center gap-2 text-sm text-slate-200">
            <ArrowRight className="h-4 w-4" />
            Resume upload, job input, and LaTeX review are staged for Patch 3.
          </div>
        </Card>
      </div>
    </main>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <CardDescription className="mb-2 uppercase tracking-[0.2em]">{title}</CardDescription>
      <p className="text-4xl font-semibold tracking-[-0.04em]">{value}</p>
      <p className="mt-3 text-sm text-muted-foreground">{description}</p>
    </Card>
  );
}

function StatusNote({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-[24px] border border-border bg-muted/40 p-4">
      <p className="mb-2 text-sm font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}
