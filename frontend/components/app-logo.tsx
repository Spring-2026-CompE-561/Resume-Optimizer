"use client";

import Link from "next/link";
import { Send } from "lucide-react";

import { cn } from "@/lib/utils";

export function AppLogo({
  className,
  href = "/",
  showText = true,
  subtitle,
}: {
  className?: string;
  href?: string;
  showText?: boolean;
  subtitle?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="ResumePilot AI dashboard"
      className={cn("inline-flex items-center gap-3", className)}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary shadow-[0_14px_30px_var(--primary-shadow)]">
        <Send className="h-4 w-4 -rotate-12 fill-current" />
      </div>
      <div className={cn("leading-none", !showText && "sr-only")}>
        <p className="whitespace-nowrap text-[1.45rem] font-semibold tracking-[-0.05em] text-foreground">
          ResumePilot <span className="text-primary">AI</span>
        </p>
        {subtitle ? (
          <p className="mt-1 text-sm tracking-[-0.02em] text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
    </Link>
  );
}
