"use client";

import type { FormEvent } from "react";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, LockKeyhole, Mail, UserRound } from "lucide-react";
import { toast } from "sonner";

import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, register } from "@/lib/api";
import { storeSession } from "@/lib/auth-storage";
import { clearDashboardCache, primeCurrentUser } from "@/lib/dashboard-cache";

export type AuthMode = "signin" | "signup";

const authCopy = {
  signin: {
    description: "Sign in to continue building stronger, more targeted applications.",
    submit: "Sign in",
    title: "Welcome back",
  },
  signup: {
    description: "Create your account and move straight into your resume workspace.",
    submit: "Create account",
    title: "Create your account",
  },
};

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const copy = authCopy[mode];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    void (async () => {
      try {
        const session =
          mode === "signup"
            ? await register({ name: name.trim() || undefined, email, password })
            : await login(email, password);

        clearDashboardCache();
        storeSession(session);
        primeCurrentUser(session.user);
        toast.success(mode === "signup" ? "Account created." : "Signed in.");
        router.push("/dashboard");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "We couldn't complete that request.";
        toast.error(message);
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    })();
  }

  return (
    <main className="min-h-screen px-6 py-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[1380px] flex-col rounded-[36px] border border-border bg-card-elevated p-6 shadow-[0_30px_80px_var(--card-shadow)] backdrop-blur-sm lg:p-8">
        <header className="flex items-center justify-between gap-4">
          <AppLogo href="/" />
          <Link
            href="/"
            className="text-sm font-medium tracking-[-0.03em] text-muted-foreground transition hover:text-foreground"
          >
            Back to home
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center py-8 lg:py-12">
          <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[minmax(0,540px)_minmax(280px,360px)] lg:items-center">
            <Card className="rounded-[36px] p-8 lg:p-10">
              <div className="space-y-8">
                <div className="inline-flex rounded-2xl bg-accent p-1.5">
                  <Link
                    href="/auth?mode=signin"
                    className={`rounded-[14px] px-5 py-3 text-sm font-medium tracking-[-0.03em] transition ${
                      mode === "signin"
                        ? "bg-card text-foreground shadow-[0_10px_24px_var(--soft-shadow)]"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth?mode=signup"
                    className={`rounded-[14px] px-5 py-3 text-sm font-medium tracking-[-0.03em] transition ${
                      mode === "signup"
                        ? "bg-card text-foreground shadow-[0_10px_24px_var(--soft-shadow)]"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Sign up
                  </Link>
                </div>

                <div className="space-y-3">
                  <CardTitle className="text-4xl tracking-[-0.06em]">{copy.title}</CardTitle>
                  <CardDescription className="max-w-lg text-base leading-7 tracking-[-0.03em]">
                    {copy.description}
                  </CardDescription>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                  {mode === "signup" ? (
                    <div className="space-y-2.5">
                      <Label htmlFor="name">Full name</Label>
                      <div className="relative">
                        <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="name"
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          placeholder="Your name"
                          autoComplete="name"
                          className="h-14 rounded-2xl border-border bg-input pl-11"
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-2.5">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="jordan.lee@example.com"
                        required
                        className="h-14 rounded-2xl border-border bg-input pl-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        autoComplete={mode === "signin" ? "current-password" : "new-password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Enter your password"
                        required
                        className="h-14 rounded-2xl border-border bg-input pl-11"
                      />
                    </div>
                  </div>

                  <Button className="mt-4 w-full" size="lg" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {mode === "signin" ? "Signing in..." : "Creating account..."}
                      </>
                    ) : (
                      <>
                        {copy.submit}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </Card>

            <div className="space-y-5">
              <Card className="rounded-[32px] p-8">
                <div className="space-y-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                    Quick start
                  </p>
                  <h2 className="text-3xl font-semibold tracking-[-0.06em] text-foreground">
                    A cleaner way to tailor each application
                  </h2>
                  <p className="text-base leading-7 tracking-[-0.03em] text-muted-foreground">
                    Upload one resume, add the role you want, and generate an optimized draft in a
                    focused flow.
                  </p>
                </div>
              </Card>

              <Card className="rounded-[32px] bg-card p-8">
                <div className="space-y-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                    What you can expect
                  </p>
                  <ul className="space-y-4 text-base tracking-[-0.03em] text-foreground">
                    <li className="rounded-2xl bg-accent px-4 py-3">One place for resumes, roles, and drafts</li>
                    <li className="rounded-2xl bg-accent px-4 py-3">Guided optimization without clutter</li>
                    <li className="rounded-2xl bg-accent px-4 py-3">Fast access to download-ready history</li>
                  </ul>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
