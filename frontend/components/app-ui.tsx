import Link from "next/link";
import type { ReactNode } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Download,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-xl bg-accent px-3 py-2 text-sm font-medium tracking-[-0.03em] text-accent-foreground">
      {children}
    </span>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-4">
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <div className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-[-0.06em] text-foreground sm:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-lg tracking-[-0.03em] text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function IconCircle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(180deg,#f7f9ff_0%,#f0f4ff_100%)] text-primary",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function StatusPill({
  tone = "success",
  children,
}: {
  tone?: "success" | "warning" | "danger" | "neutral";
  children: ReactNode;
}) {
  const toneClass =
    tone === "warning"
      ? "bg-[rgba(255,180,59,0.15)] text-[hsl(35_96%_42%)]"
      : tone === "danger"
        ? "bg-[rgba(255,93,84,0.12)] text-[var(--color-danger)]"
        : tone === "neutral"
          ? "bg-accent text-accent-foreground"
          : "bg-[rgba(43,193,122,0.14)] text-[var(--color-success)]";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium tracking-[-0.03em]",
        toneClass,
      )}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function KeywordPill({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full border border-[rgba(98,124,255,0.16)] bg-accent px-4 py-2 text-sm font-medium tracking-[-0.03em] text-primary">
      {label}
    </span>
  );
}

export function EmptyPanel({
  title,
  description,
  href,
  actionLabel,
}: {
  title: string;
  description: string;
  href?: string;
  actionLabel?: string;
}) {
  return (
    <Card className="border-dashed border-[rgba(133,153,214,0.35)] bg-white/70 text-center">
      <div className="space-y-3 py-3">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
          <FileText className="h-5 w-5" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold tracking-[-0.04em]">{title}</h3>
          <p className="mx-auto max-w-md text-sm leading-7 tracking-[-0.02em] text-muted-foreground">
            {description}
          </p>
        </div>
        {href && actionLabel ? (
          <Button asChild>
            <Link href={href}>{actionLabel}</Link>
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

export function PreviewResumeCard({
  title,
  subtitle,
  score,
  compact = false,
}: {
  title: string;
  subtitle: string;
  score?: number;
  compact?: boolean;
}) {
  return (
    <div className="rounded-[24px] border border-[rgba(176,190,235,0.45)] bg-white p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <h3 className={cn("font-semibold tracking-[-0.05em] text-foreground", compact ? "text-3xl" : "text-4xl")}>
              {title}
            </h3>
            <p className="text-lg font-medium tracking-[-0.03em] text-foreground">{subtitle}</p>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <span>San Francisco, CA</span>
              <span>&bull;</span>
              <span>alex.johnson@gmail.com</span>
              <span>&bull;</span>
              <span>(415) 555-0100</span>
            </div>
          </div>

          {typeof score === "number" ? (
            <StatusPill tone="success">ATS Score {score}</StatusPill>
          ) : null}
        </div>

        <div className="space-y-6">
          <PreviewLines label="Professional Summary" lines={[92, 72, 46]} />
          <PreviewLines label="Experience" lines={[84, 76, 64]} bullets />
        </div>
      </div>
    </div>
  );
}

function PreviewLines({
  bullets = false,
  label,
  lines,
}: {
  bullets?: boolean;
  label: string;
  lines: number[];
}) {
  return (
    <div className="space-y-4">
      <p className="text-lg font-semibold tracking-[-0.03em] text-foreground">{label}</p>
      <div className="space-y-3">
        {lines.map((width, index) => (
          <div key={`${label}-${width}-${index}`} className="flex items-center gap-3">
            {bullets ? <span className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
            <span
              className="block h-2.5 rounded-full bg-[linear-gradient(90deg,#e1e7f5_0%,#d7deef_100%)]"
              style={{ width: `${width}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailRow({
  icon,
  label,
  value,
  link,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
  link?: string | null;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-primary">
        {icon ?? <CalendarDays className="h-4 w-4" />}
      </div>
      <div className="min-w-0 space-y-1">
        <p className="text-base font-medium tracking-[-0.03em] text-muted-foreground">{label}</p>
        {link ? (
          <a
            href={link}
            className="break-all text-lg font-medium tracking-[-0.04em] text-primary transition hover:opacity-80"
            rel="noreferrer"
            target="_blank"
          >
            {value}
          </a>
        ) : (
          <p className="break-words text-lg font-medium tracking-[-0.04em] text-foreground">{value}</p>
        )}
      </div>
    </div>
  );
}

export function ProgressList({
  steps,
}: {
  steps: Array<{ complete: boolean; description?: string; label: string; pending?: boolean }>;
}) {
  return (
    <div className="space-y-8">
      {steps.map((step, index) => (
        <div key={step.label} className="relative flex gap-4">
          {index < steps.length - 1 ? (
            <span className="absolute left-[19px] top-10 h-[calc(100%+16px)] w-px bg-border" />
          ) : null}
          <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-primary">
            {step.complete ? (
              <CheckCircle2 className="h-5 w-5 text-[var(--color-success)]" />
            ) : step.pending ? (
              <Circle className="h-5 w-5 text-muted-foreground" />
            ) : (
              index + 1
            )}
          </div>
          <div className="space-y-1 pt-1">
            <p className="text-lg font-medium tracking-[-0.04em] text-foreground">{step.label}</p>
            {step.description ? (
              <p className="max-w-xs text-sm leading-6 text-muted-foreground">{step.description}</p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DownloadButton({
  disabled,
  onClick,
}: {
  disabled?: boolean;
  onClick: () => void | Promise<void>;
}) {
  return (
    <Button className="w-full" size="lg" onClick={onClick} disabled={disabled}>
      <Download className="mr-2 h-4 w-4" />
      Download PDF
    </Button>
  );
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function deriveResumeTitle(fileName: string) {
  return fileName.replace(/\.(pdf|docx?)$/i, "");
}
