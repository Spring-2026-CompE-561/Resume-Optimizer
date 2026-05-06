"use client";

import type { ChangeEvent, ReactNode } from "react";
import { useDeferredValue, useEffect, useEffectEvent, useState } from "react";
import { BriefcaseBusiness, CalendarDays, FileText, Loader2, Search, Target } from "lucide-react";
import { toast } from "sonner";

import {
  DownloadButton,
  Eyebrow,
  PaginationControls,
  PreviewResumeCard,
  StatusPill,
  formatDate,
  formatDateTime,
} from "@/components/app-ui";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchOptimizations, fetchOptimizationsPage } from "@/lib/api";
import { loadResumes } from "@/lib/dashboard-cache";
import { downloadAuthenticatedFile } from "@/lib/download";
import type { OptimizationRunRecord, PaginationMeta, ResumeRecord } from "@/lib/types";

const PAGE_LIMIT = 6;

export function DashboardHistoryPage() {
  const [optimizations, setOptimizations] = useState<OptimizationRunRecord[]>([]);
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [activeOptimizationId, setActiveOptimizationId] = useState<number | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const deferredQuery = useDeferredValue(searchQuery);

  const refreshHistory = useEffectEvent(async (targetPage: number, query: string) => {
    const [optimizationPage, nextResumes] = query.trim()
      ? await Promise.all([fetchOptimizations(), loadResumes()]).then(
          ([allOptimizations, loadedResumes]) => {
            const filteredOptimizations = sortOptimizations(allOptimizations).filter(
              (optimization) => optimizationMatchesSearch(optimization, loadedResumes, query),
            );
            const start = (targetPage - 1) * PAGE_LIMIT;

            return [
              {
                items: filteredOptimizations.slice(start, start + PAGE_LIMIT),
                pagination: buildClientPagination(filteredOptimizations.length, targetPage),
              },
              loadedResumes,
            ] as const;
          },
        )
      : await Promise.all([
          fetchOptimizationsPage({ page: targetPage, limit: PAGE_LIMIT }),
          loadResumes(),
        ]);
    const orderedOptimizations = sortOptimizations(optimizationPage.items);
    setOptimizations(orderedOptimizations);
    setPagination(optimizationPage.pagination);
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
        setIsLoading(true);
        await refreshHistory(page, deferredQuery);
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
  }, [deferredQuery, page]);

  function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
    setSearchQuery(event.target.value);
    setPage(1);
    setActiveOptimizationId(null);
  }

  async function handleDownload(activeOptimization: OptimizationRunRecord) {
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

  const activeOptimization =
    optimizations.find((item) => item.id === activeOptimizationId) ??
    optimizations[0] ??
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
              onChange={handleSearchChange}
              placeholder="Search optimization runs..."
              className="h-12 rounded-2xl bg-input pl-11"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3 shadow-[0_20px_50px_var(--soft-shadow)]">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Loading history...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {optimizations.length > 0 ? (
                optimizations.map((optimization) => {
                  const active = optimization.id === activeOptimization?.id;
                  const resumeName =
                    resumes.find((resume) => resume.id === optimization.resume_id)?.file_name ??
                    "Selected resume";

                  return (
                    <button
                      key={optimization.id}
                      type="button"
                      onClick={() => setActiveOptimizationId(optimization.id)}
                      className={`w-full rounded-[32px] border bg-card p-6 text-left shadow-[0_18px_50px_var(--soft-shadow)] transition ${
                        active
                          ? "border-[rgba(92,124,255,0.6)] ring-2 ring-[rgba(92,124,255,0.12)]"
                          : "border-border hover:-translate-y-0.5"
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
                })
              ) : (
                <Card className="rounded-[32px] border-dashed border-border bg-card-elevated p-6">
                  <p className="text-base font-medium tracking-[-0.03em] text-muted-foreground">
                    {deferredQuery.trim()
                      ? "No optimization runs match that search."
                      : "No optimization runs yet."}
                  </p>
                </Card>
              )}
              {pagination ? (
                <PaginationControls pagination={pagination} onPageChange={setPage} />
              ) : null}
            </div>
          )}
        </div>

        <Card className="h-fit rounded-[32px] p-6 xl:sticky xl:top-28">
          {activeOptimization ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                      Draft details
                    </p>
                    <h2 className="text-3xl font-semibold tracking-[-0.06em] text-foreground">
                      {activeOptimization.target_job_title || "Optimized draft"}
                    </h2>
                  </div>
                  <StatusPill>Completed</StatusPill>
                </div>
                <p className="text-base leading-7 tracking-[-0.03em] text-muted-foreground">
                  {activeOptimization.target_company || "Target company"} -{" "}
                  {formatDateTime(activeOptimization.created_at)}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <DetailMetric
                  icon={<BriefcaseBusiness className="h-4 w-4" />}
                  label="Title"
                  value={activeOptimization.target_job_title || "Optimized draft"}
                />
                <DetailMetric
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="Date"
                  value={formatDate(activeOptimization.created_at)}
                />
                <DetailMetric
                  icon={<FileText className="h-4 w-4" />}
                  label="Type"
                  value="Optimized resume"
                />
                <DetailMetric label="Status" value="Completed" />
              </div>

              <div className="rounded-[24px] bg-accent p-5">
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold tracking-[-0.05em] text-foreground">
                    Draft Content
                  </h3>
                  <p className="max-h-56 overflow-y-auto whitespace-pre-line text-sm leading-6 tracking-[-0.02em] text-muted-foreground">
                    {activeOptimization.optimized_resume_text || "No optimized text is available for this run."}
                  </p>
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
                onClick={() => handleDownload(activeOptimization)}
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

function sortOptimizations(optimizations: OptimizationRunRecord[]) {
  return [...optimizations].sort((left, right) => {
    const dateDelta = new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
    return dateDelta || right.id - left.id;
  });
}

function optimizationMatchesSearch(
  optimization: OptimizationRunRecord,
  resumes: ResumeRecord[],
  query: string,
) {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }

  const resumeName = resumes.find((resume) => resume.id === optimization.resume_id)?.file_name ?? "";

  return [optimization.target_job_title, optimization.target_company, resumeName]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

function buildClientPagination(total: number, page: number): PaginationMeta {
  const pages = Math.ceil(total / PAGE_LIMIT);

  return {
    page,
    limit: PAGE_LIMIT,
    total,
    pages,
    has_next: page < pages,
    has_previous: page > 1 && pages > 0,
  };
}

function DetailMetric({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] bg-accent px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-medium tracking-[-0.03em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 break-words text-base font-semibold tracking-[-0.04em] text-foreground">
        {value}
      </p>
    </div>
  );
}
