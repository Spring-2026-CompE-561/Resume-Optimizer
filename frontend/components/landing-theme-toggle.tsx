"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/theme-provider";

export function LandingThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const darkModeEnabled = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={darkModeEnabled}
      aria-label="Dark mode"
      onClick={toggleTheme}
      className="inline-flex h-9 items-center gap-2 rounded-2xl border border-border bg-card px-2 text-foreground shadow-[0_12px_30px_var(--soft-shadow)] transition hover:border-primary/30"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-accent text-primary">
        {darkModeEnabled ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
      </span>
      <span className="hidden pr-2 text-sm font-medium tracking-[-0.03em] sm:inline">
        {darkModeEnabled ? "Dark" : "Light"}
      </span>
    </button>
  );
}
