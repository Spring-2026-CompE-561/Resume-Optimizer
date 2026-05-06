"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";

import { ThemeProvider, useTheme } from "@/components/theme-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <ThemedToaster />
    </ThemeProvider>
  );
}

function ThemedToaster() {
  const { theme } = useTheme();

  return <Toaster richColors position="top-right" theme={theme} />;
}
