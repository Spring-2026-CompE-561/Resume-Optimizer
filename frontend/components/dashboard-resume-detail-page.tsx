"use client";

import { useEffect, useEffectEvent, useState, useTransition } from "react";
import Link from "next/link";
import { CalendarDays, FileText, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { DetailRow, Eyebrow, formatDate } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { deleteResume } from "@/lib/api";
import { invalidateDashboardResource, loadResumes } from "@/lib/dashboard-cache";
import type { ResumeRecord } from "@/lib/types";
import {
  readSelectedResumeId,
  writeSelectedResumeId,
} from "@/lib/workspace-selection";

export function DashboardResumeDetailPage({ resumeId }: { resumeId: number }) {
  const router = useRouter();
  const [resume, setResume] = useState<ResumeRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const loadResume = useEffectEvent(async () => {
    const resumes = await loadResumes();
    setResume(resumes.find((item) => item.id === resumeId) ?? null);
  });

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        await loadResume();
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Unable to load that resume.";
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

  function handleSelect() {
    writeSelectedResumeId(resumeId);
    toast.success("Resume selected for optimization.");
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteResume(resumeId);
        invalidateDashboardResource("resumes");
        const nextResumes = await loadResumes();
        if (readSelectedResumeId() === resumeId) {
          writeSelectedResumeId(nextResumes[0]?.id ?? null);
        }
        toast.success("Resume deleted.");
        router.push("/dashboard/resumes");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Delete failed.";
        toast.error(message);
      }
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3 shadow-[0_20px_50px_var(--soft-shadow)]">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm font-medium text-muted-foreground">Loading resume...</span>
      </div>
    );
  }

  if (!resume) {
    return (
      <Card className="rounded-[32px] p-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-[-0.06em]">Resume not found</h1>
          <Button asChild variant="secondary">
            <Link href="/dashboard/resumes">Back to resumes</Link>
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <Eyebrow>Resume Detail</Eyebrow>
          <div className="space-y-3">
            <p className="text-sm font-medium tracking-[-0.03em] text-muted-foreground">
              Workspace &gt; Resume Detail
            </p>
            <h1 className="break-words text-5xl font-semibold tracking-[-0.07em] text-foreground">
              {resume.file_name}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={handleSelect}>
            Select for optimization
          </Button>
          <Button size="lg" variant="destructive" onClick={handleDelete} disabled={isPending}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="rounded-[32px] p-8">
          <div className="space-y-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div className="space-y-5">
              <DetailRow label="File name" value={resume.file_name} icon={<FileText className="h-4 w-4" />} />
              <DetailRow
                label="Added"
                value={formatDate(resume.created_at)}
                icon={<CalendarDays className="h-4 w-4" />}
              />
              <DetailRow label="Format" value={resume.mime_type || "Document"} />
            </div>
          </div>
        </Card>

        <Card className="rounded-[32px] p-8">
          <div className="space-y-5">
            <h2 className="text-2xl font-semibold tracking-[-0.05em] text-foreground">
              Resume Preview
            </h2>
            <div className="rounded-[28px] border border-border bg-input p-6">
              <pre className="max-h-[640px] overflow-auto whitespace-pre-wrap text-sm leading-8 tracking-[-0.01em] text-foreground/88">
                {resume.parsed_text || "A text preview is not available for this resume yet."}
              </pre>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
