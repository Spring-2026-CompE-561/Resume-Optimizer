"use client";

import { Mail, Moon, ShieldCheck, Sun, UserRound } from "lucide-react";

import { DetailRow, Eyebrow } from "@/components/app-ui";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/components/theme-provider";
import { readStoredUser } from "@/lib/auth-storage";

export function DashboardSettingsPage() {
  const user = readStoredUser();
  const { setTheme, theme } = useTheme();
  const darkModeEnabled = theme === "dark";

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Eyebrow>Settings</Eyebrow>
        <div className="space-y-3">
          <h1 className="text-5xl font-semibold tracking-[-0.07em] text-foreground">Settings</h1>
          <p className="text-lg tracking-[-0.03em] text-muted-foreground">
            Manage your account and workspace display preferences.
          </p>
        </div>
      </div>

      <div className="grid max-w-5xl gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="rounded-[32px] p-8">
          <div className="space-y-6">
            <DetailRow label="Name" value={user?.name || "ResumePilot user"} icon={<UserRound className="h-4 w-4" />} />
            <DetailRow label="Email" value={user?.email || "Not available"} icon={<Mail className="h-4 w-4" />} />
            <DetailRow
              label="Account Status"
              value={user?.is_active ? "Active" : "Unavailable"}
              icon={<ShieldCheck className="h-4 w-4" />}
            />
          </div>
        </Card>

        <Card className="rounded-[32px] p-8">
          <div className="space-y-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary">
              {darkModeEnabled ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-[-0.05em] text-foreground">
                Appearance
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Choose the theme used across your workspace.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={darkModeEnabled}
              aria-label="Dark mode"
              onClick={() => setTheme(darkModeEnabled ? "light" : "dark")}
              className="flex w-full items-center justify-between rounded-[24px] border border-border bg-input px-4 py-3 text-left transition hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span>
                <span className="block text-base font-semibold text-foreground">Dark mode</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {darkModeEnabled ? "Enabled" : "Disabled"}
                </span>
              </span>
              <span
                className={`flex h-8 w-14 items-center rounded-full p-1 transition ${
                  darkModeEnabled ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`h-6 w-6 rounded-full bg-card shadow-[0_6px_16px_var(--soft-shadow)] transition ${
                    darkModeEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </span>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
