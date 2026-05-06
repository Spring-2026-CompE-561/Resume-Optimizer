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
import type { PaginationMeta } from "@/lib/types";

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
        "flex h-16 w-16 items-center justify-center rounded-full bg-accent text-primary",
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
    <Card className="border-dashed border-border bg-card-elevated text-center">
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

export function PaginationControls({
  pagination,
  onPageChange,
}: {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}) {
  const displayPages = Math.max(pagination.pages, 1);
  const displayPage = Math.min(pagination.page, displayPages);
  const startItem =
    pagination.total === 0
      ? 0
      : Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total);
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total);

  if (pagination.pages <= 1 && !pagination.has_previous) {
    return null;
  }

  return (
    <div className="flex max-w-full flex-col gap-3 overflow-hidden rounded-[24px] border border-border bg-card px-4 py-3 shadow-[0_14px_36px_var(--soft-shadow)] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <p className="text-sm font-medium text-muted-foreground">
        Showing {startItem}-{endItem} of {pagination.total}
      </p>
      <div className="grid w-full max-w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:w-auto">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={!pagination.has_previous}
          className="min-w-0 px-3"
        >
          Previous
        </Button>
        <span className="min-w-[78px] text-center text-sm font-semibold text-foreground">
          Page {displayPage} of {displayPages}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={!pagination.has_next}
          className="min-w-0 px-3"
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export function PreviewResumeCard({
  content,
  title,
  subtitle,
  score,
  compact = false,
}: {
  content?: string | null;
  title: string;
  subtitle: string;
  score?: number;
  compact?: boolean;
}) {
  const preview = parseResumePreview(content, title, subtitle);
  const hasContent = preview.sections.some((section) => section.lines.length > 0);
  const pages = hasContent ? paginateResumePreview(preview, compact) : [];

  return (
    <div className="rounded-[24px] border border-border bg-[var(--resume-shell)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] sm:p-6">
      <div className="mx-auto flex max-w-[760px] flex-col gap-5">
        {hasContent ? (
          pages.map((page, pageIndex) => (
            <PreviewResumePage
              key={`resume-preview-page-${pageIndex}`}
              compact={compact}
              pageNumber={pageIndex + 1}
              preview={preview}
              score={pageIndex === 0 ? score : undefined}
              sections={page.sections}
              showHeader={pageIndex === 0}
              totalPages={pages.length}
            />
          ))
        ) : (
          <PreviewResumePage
            compact={compact}
            pageNumber={1}
            preview={preview}
            score={score}
            sections={[]}
            showHeader
            totalPages={1}
          >
            <div className="rounded-lg border border-dashed border-[var(--resume-rule)] bg-[var(--resume-empty)] px-4 py-6 text-sm font-medium text-[var(--resume-muted)]">
              This draft does not have previewable resume text yet.
            </div>
          </PreviewResumePage>
        )}
      </div>
    </div>
  );
}

type ResumePreviewSection = {
  title: string;
  lines: string[];
};

type ResumePreview = {
  contact: string[];
  headline: string;
  name: string;
  sections: ResumePreviewSection[];
};

type ResumePreviewPage = {
  sections: ResumePreviewSection[];
};

const RESUME_SECTION_TITLES = new Set([
  "applied improvements",
  "certifications",
  "education",
  "experience",
  "projects",
  "role alignment",
  "skills",
  "summary",
  "targeted highlights",
]);

function parseResumePreview(
  content: string | null | undefined,
  fallbackName: string,
  fallbackHeadline: string,
): ResumePreview {
  const lines = (content || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const name = lines[0] || fallbackName;
  let cursor = lines[0] ? 1 : 0;
  let headline = fallbackHeadline;
  const contact: string[] = [];

  if (
    lines[cursor] &&
    !looksLikeContactLine(lines[cursor]) &&
    !isKnownSectionTitle(lines[cursor])
  ) {
    headline = lines[cursor];
    cursor += 1;
  }

  if (lines[cursor] && looksLikeContactLine(lines[cursor])) {
    contact.push(...splitContactLine(lines[cursor]));
    cursor += 1;
  }

  const sections: ResumePreviewSection[] = [];
  let currentSection: ResumePreviewSection | null = null;

  for (const line of lines.slice(cursor)) {
    if (looksLikeSectionTitle(line)) {
      currentSection = { title: normalizeSectionTitle(line), lines: [] };
      sections.push(currentSection);
      continue;
    }

    if (!currentSection) {
      currentSection = { title: "Summary", lines: [] };
      sections.push(currentSection);
    }

    currentSection.lines.push(cleanPreviewLine(line));
  }

  return {
    contact,
    headline,
    name,
    sections: sections.filter((section) => section.lines.length > 0),
  };
}

function looksLikeContactLine(line: string) {
  return /@|linkedin|github|\(\d{3}\)|\d{3}[-.\s]\d{3}[-.\s]\d{4}|\|/.test(line.toLowerCase());
}

function splitContactLine(line: string) {
  return line
    .split(/\s+\|\s+|\u2022/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function looksLikeSectionTitle(line: string) {
  if (/^[-*\u2022]\s+/.test(line)) {
    return false;
  }

  if (isKnownSectionTitle(line)) {
    return true;
  }

  return line.length <= 36 && line.split(/\s+/).length <= 4 && /^[A-Z][A-Za-z\s/&-]+$/.test(line);
}

function isKnownSectionTitle(line: string) {
  return RESUME_SECTION_TITLES.has(line.replace(/:$/, "").toLowerCase());
}

function normalizeSectionTitle(line: string) {
  const normalized = line.replace(/:$/, "").trim();
  return normalized || "Details";
}

function cleanPreviewLine(line: string) {
  return line.replace(/^[-*\u2022]\s+/, "").replace(/\s+/g, " ").trim();
}

function PreviewResumePage({
  children,
  compact,
  pageNumber,
  preview,
  score,
  sections,
  showHeader,
  totalPages,
}: {
  children?: ReactNode;
  compact: boolean;
  pageNumber: number;
  preview: ResumePreview;
  score?: number;
  sections: ResumePreviewSection[];
  showHeader: boolean;
  totalPages: number;
}) {
  return (
    <div
      aria-label={`Resume preview page ${pageNumber} of ${totalPages}`}
      className={cn(
        "relative aspect-[210/297] overflow-hidden rounded-md bg-[var(--resume-paper)] px-8 py-10 text-[var(--resume-ink)] shadow-[0_24px_70px_var(--card-shadow)] sm:px-12",
        compact && "px-7 py-8 sm:px-9",
      )}
    >
      <div className="flex h-full flex-col">
        <div className="min-h-0 flex-1 space-y-7 overflow-hidden">
          {showHeader ? <PreviewHeader compact={compact} preview={preview} score={score} /> : null}

          {children ?? (
            <div className="space-y-6">
              {sections.map((section, index) => (
                <PreviewSection key={`${section.title}-${pageNumber}-${index}`} section={section} />
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 border-t border-[var(--resume-rule)] pt-2 text-right text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--resume-muted)]">
          Page {pageNumber} of {totalPages}
        </div>
      </div>
    </div>
  );
}

function PreviewHeader({
  compact,
  preview,
  score,
}: {
  compact: boolean;
  preview: ResumePreview;
  score?: number;
}) {
  return (
    <div className="border-b border-[var(--resume-rule)] pb-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <h3
            className={cn(
              "break-words font-serif text-4xl font-semibold leading-tight text-[var(--resume-heading)]",
              compact && "text-3xl",
            )}
          >
            {preview.name}
          </h3>
          {preview.headline ? (
            <p className="text-base font-semibold uppercase text-[var(--resume-muted)]">
              {preview.headline}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-x-2 gap-y-1 text-sm text-[var(--resume-muted)]">
            {preview.contact.length > 0 ? (
              preview.contact.map((item, index) => (
                <span key={`${item}-${index}`} className="inline-flex items-center gap-2">
                  {index > 0 ? <span className="h-1 w-1 rounded-full bg-[var(--resume-muted)]" /> : null}
                  {item}
                </span>
              ))
            ) : (
              <span>Contact details available in uploaded resume</span>
            )}
          </div>
        </div>

        {typeof score === "number" ? <StatusPill tone="success">ATS Score {score}</StatusPill> : null}
      </div>
    </div>
  );
}

function PreviewSection({ section }: { section: ResumePreviewSection }) {
  const isSkills = section.title.toLowerCase() === "skills";
  const skillItems = isSkills
    ? section.lines.flatMap((line) => line.split(",")).map((line) => line.trim()).filter(Boolean)
    : [];

  return (
    <div className="space-y-3">
      <p className="border-b border-[var(--resume-rule)] pb-1 text-sm font-bold uppercase text-[var(--resume-accent)]">
        {section.title}
      </p>
      {isSkills ? (
        <div className="flex flex-wrap gap-2">
          {skillItems.map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-[var(--resume-chip)] px-2.5 py-1 text-xs font-semibold text-[var(--resume-chip-text)]"
            >
              {skill}
            </span>
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {section.lines.slice(0, 8).map((line, index) => (
            <li key={`${section.title}-${line}-${index}`} className="flex gap-3 text-sm leading-6">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function paginateResumePreview(preview: ResumePreview, compact: boolean): ResumePreviewPage[] {
  const firstPageCapacity = compact ? 26 : 30;
  const continuationPageCapacity = compact ? 34 : 40;
  const pages: ResumePreviewPage[] = [{ sections: [] }];
  let remainingUnits = firstPageCapacity;

  function addPage() {
    pages.push({ sections: [] });
    remainingUnits = continuationPageCapacity;
  }

  for (const section of preview.sections) {
    const lines = getPaginatedSectionLines(section);
    let cursor = 0;

    while (cursor < lines.length) {
      const currentPage = pages[pages.length - 1];
      const pageCapacity = pages.length === 1 ? firstPageCapacity : continuationPageCapacity;
      let sectionLines: string[] = [];
      let sectionUnits = 2;

      while (cursor < lines.length) {
        const lineUnits = estimatePreviewLineUnits(lines[cursor], section.title, compact);

        if (sectionUnits + lineUnits > remainingUnits && sectionLines.length > 0) {
          break;
        }

        if (sectionUnits + lineUnits > remainingUnits && remainingUnits < pageCapacity) {
          break;
        }

        sectionLines.push(lines[cursor]);
        sectionUnits += lineUnits;
        cursor += 1;
      }

      if (sectionLines.length === 0) {
        addPage();
        continue;
      }

      currentPage.sections.push({ title: section.title, lines: sectionLines });
      remainingUnits -= sectionUnits;

      if (cursor < lines.length) {
        addPage();
      }
    }
  }

  return pages.filter((page) => page.sections.length > 0);
}

function getPaginatedSectionLines(section: ResumePreviewSection) {
  if (section.title.toLowerCase() !== "skills") {
    return section.lines;
  }

  return section.lines
    .flatMap((line) => line.split(","))
    .map((line) => line.trim())
    .filter(Boolean);
}

function estimatePreviewLineUnits(line: string, sectionTitle: string, compact: boolean) {
  if (sectionTitle.toLowerCase() === "skills") {
    return 1;
  }

  const maxCharactersPerLine = compact ? 58 : 72;
  return Math.max(1, Math.ceil(line.length / maxCharactersPerLine));
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
  className,
  disabled,
  onClick,
}: {
  className?: string;
  disabled?: boolean;
  onClick: () => void | Promise<void>;
}) {
  return (
    <Button
      className={cn(
        "w-full bg-primary font-semibold text-primary-foreground shadow-[0_18px_40px_var(--primary-shadow)] hover:bg-primary hover:brightness-95 disabled:border disabled:border-border disabled:bg-card disabled:text-foreground disabled:opacity-100 disabled:shadow-none",
        className,
      )}
      size="lg"
      onClick={onClick}
      disabled={disabled}
    >
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
