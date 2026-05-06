import Link from "next/link";

import { AppLogo } from "@/components/app-logo";
import { LandingThemeToggle } from "@/components/landing-theme-toggle";
import { Button } from "@/components/ui/button";

export function SiteNavbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-[var(--header-surface)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-6 px-6 py-5 lg:px-8">
        <AppLogo href="/" />

        <nav className="hidden items-center gap-10 text-base font-medium tracking-[-0.03em] text-muted-foreground lg:flex">
          <a className="transition hover:text-foreground" href="#how-it-works">
            How it works
          </a>
          <a className="transition hover:text-foreground" href="#features">
            Features
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <LandingThemeToggle />
          <Button asChild variant="secondary" size="sm">
            <Link href="/auth?mode=signup">Create account</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/auth?mode=signin">Sign in</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
