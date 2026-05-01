import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 lg:px-8">
      <div className="mb-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>

      <div className="grid flex-1 gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
            Authentication
          </p>
          <h1 className="text-5xl font-semibold tracking-[-0.04em]">
            Sign in to reach the optimization workspace.
          </h1>
          <p className="max-w-xl text-lg leading-8 text-muted-foreground">
            This stage focuses on stable access to the backend APIs. Once you are authenticated,
            the dashboard verifies the session and loads live counts from FastAPI.
          </p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
