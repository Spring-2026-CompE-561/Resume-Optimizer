"use client";

import { useDeferredValue, useEffect, useEffectEvent, useState } from "react";
import { Loader2, Search, Target } from "lucide-react";
import { toast } from "sonner";

import {
  DownloadButton,
  Eyebrow,
  PreviewResumeCard,
  StatusPill,
  formatDate,
  formatDateTime,
} from "@/components/app-ui";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { loadOptimizations, loadResumes } from "@/lib/dashboard-cache";
import { downloadAuthenticatedFile } from "@/lib/download";
import type { OptimizationRunRecord, ResumeRecord } from "@/lib/types";

export function DashboardHistoryPage() {
  const [optimizations, setOptimizations] = useState<OptimizationRunRecord[]>([]);
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [activeOptimizationId, setActiveOptimizationId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const deferredQuery = useDeferredValue(searchQuery);

  const refreshHistory = useEffectEvent(async () => {
    const [nextOptimizations, nextResumes] = await Promise.all([loadOptimizations(), loadResumes()]);
    const orderedOptimizations = [...nextOptimizations].sort(
      (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
    );
    setOptimizations(orderedOptimizations);
    setResumes(nextResumes);
    setActiveOptimizationId((current) =>
      orderedOptimizations.some((optimization) => optimization.id === current)
        ? current
        : (orderedOptimizations[0]?.id ?? null),
    );
  });

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        await refreshHistory();
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Unable to load your history.";
          toast.error(message);
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
  }, []);

  async function handleDownload() {
    const activeOptimization = optimizations.find((item) => item.id === activeOptimizationId);
    if (!activeOptimization?.pdf_download_url) {
      toast.error("No PDF is available for this draft yet.");
      return;
    }

    try {
      await downloadAuthenticatedFile(
        activeOptimization.pdf_download_url,
        `optimized-resume-${activeOptimization.id}.pdf`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Download failed.";
      toast.error(message);
    }
  }

  const filteredOptimizations = optimizations.filter((optimization) => {
    const needle = deferredQuery.trim().toLowerCase();
    if (!needle) {
      return true;
    }

    const resumeName =
      resumes.find((resume) => resume.id === optimization.resume_id)?.file_name ?? "";

    return [optimization.target_job_title, optimization.target_company, resumeName]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });

  const activeOptimization =
    filteredOptimizations.find((item) => item.id === activeOptimizationId) ??
    optimizations.find((item) => item.id === activeOptimizationId) ??
    null;
  const activeResume =
    resumes.find((resume) => resume.id === activeOptimization?.resume_id) ?? null;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Eyebrow>Workspace</Eyebrow>
        <div className="space-y-3">
          <h1 className="text-5xl font-semibold tracking-[-0.07em] text-foreground">
            Optimization History
          </h1>
          <p className="text-lg tracking-[-0.03em] text-muted-foreground">
            View your past optimization runs.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-5">
          <div className="relative max-w-lg">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search optimization runs..."
              className="h-12 rounded-2xl bg-white pl-11"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center gap-3 rounded-full border border-white bg-white px-5 py-3 shadow-[0_20px_50px_rgba(20,37,84,0.08)]">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Loading history...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOptimizations.map((optimization) => {
                const active = optimization.id === activeOptimization?.id;
                const resumeName =
                  resumes.find((resume) => resume.id === optimization.resume_id)?.file_name ??
                  "Selected resume";

                return (
                  <button
                    key={optimization.id}
                    type="button"
                    onClick={() => setActiveOptimizationId(optimization.id)}
                    className={`w-full rounded-[32px] border bg-white p-6 text-left shadow-[0_18px_50px_rgba(20,37,84,0.06)] transition ${
                      active
                        ? "border-[rgba(92,124,255,0.6)] ring-2 ring-[rgba(92,124,255,0.12)]"
                        : "border-white hover:-translate-y-0.5"
                    }`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
                          <Target className="h-5 w-5" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-2xl font-semibold tracking-[-0.05em] text-foreground">
                            {optimization.target_job_title || "Optimized draft"}
                          </p>
                          <p className="text-base tracking-[-0.03em] text-muted-foreground">
                            {optimization.target_company || "Target company"}
                          </p>
                          <p className="text-sm text-muted-foreground">{resumeName}</p>
                        </div>
                      </div>
                      <div className="space-y-3 lg:text-right">
                        <p className="text-lg font-medium tracking-[-0.03em] text-muted-foreground">
                          {formatDate(optimization.created_at)}
                        </p>
                        <StatusPill>Completed</StatusPill>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <Card className="h-fit rounded-[32px] p-6">
          {activeOptimization ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold tracking-[-0.05em] text-foreground">
                Optimization Details
              </h2>

              <div className="space-y-5">
                <div>
                  <p className="text-base font-medium tracking-[-0.03em] text-muted-foreground">
                    Role
                  </p>
                  <p className="mt-1 text-2xl font-semibold tracking-[-0.05em] text-foreground">
                    {activeOptimization.target_job_title || "Optimized draft"}
                  </p>
                </div>
                <div>
                  <p className="text-base font-medium tracking-[-0.03em] text-muted-foreground">
                    Company
                  </p>
                  <p className="mt-1 text-2xl font-semibold tracking-[-0.05em] text-foreground">
                    {activeOptimization.target_company || "Target company"}
                  </p>
                </div>
                <div>
                  <p className="text-base font-medium tracking-[-0.03em] text-muted-foreground">
                    Resume Used
                  </p>
                  <p className="mt-1 break-words text-lg font-medium tracking-[-0.04em] text-foreground">
                    {activeResume?.file_name || "Selected resume"}
                  </p>
                </div>
                <div>
                  <p className="text-base font-medium tracking-[-0.03em] text-muted-foreground">
                    Date
                  </p>
                  <p className="mt-1 text-lg font-medium tracking-[-0.04em] text-foreground">
                    {formatDateTime(activeOptimization.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-base font-medium tracking-[-0.03em] text-muted-foreground">
                    Status
                  </p>
                  <div className="mt-2">
                    <StatusPill>Completed</StatusPill>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="mb-4 text-2xl font-semibold tracking-[-0.05em] text-foreground">
                  Optimized Resume Preview
                </h3>
                <PreviewResumeCard
                  content={activeOptimization.optimized_resume_text}
                  title={activeResume?.file_name || "Optimized Resume"}
                  subtitle={activeOptimization.target_job_title || "Optimized draft"}
                  compact
                />
              </div>

              <DownloadButton
                onClick={handleDownload}
                disabled={!activeOptimization.pdf_download_url}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-[-0.05em] text-foreground">
                No result selected
              </h2>
              <p className="text-base tracking-[-0.03em] text-muted-foreground">
                Select an optimization run to review its details and download the PDF.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
