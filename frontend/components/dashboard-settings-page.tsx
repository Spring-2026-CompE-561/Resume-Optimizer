"use client";

import { Mail, ShieldCheck, UserRound } from "lucide-react";

import { DetailRow, Eyebrow } from "@/components/app-ui";
import { Card } from "@/components/ui/card";
import { readStoredUser } from "@/lib/auth-storage";

export function DashboardSettingsPage() {
  const user = readStoredUser();

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Eyebrow>Settings</Eyebrow>
        <div className="space-y-3">
          <h1 className="text-5xl font-semibold tracking-[-0.07em] text-foreground">Settings</h1>
          <p className="text-lg tracking-[-0.03em] text-muted-foreground">
            A simple view of the account connected to this workspace.
          </p>
        </div>
      </div>

      <Card className="max-w-3xl rounded-[32px] p-8">
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
    </div>
  );
}
