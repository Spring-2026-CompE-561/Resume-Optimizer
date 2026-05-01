"use client";

import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequestLogin } from "@/lib/login-action";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      try {
        await apiRequestLogin(email, password);
        toast.success("Session created.");
        router.push("/dashboard");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to log in with those credentials.";
        toast.error(message);
      }
    });
  }

  return (
    <Card className="mx-auto w-full max-w-md p-8">
      <div className="mb-8 space-y-2">
        <CardTitle>Log in</CardTitle>
        <CardDescription>
          Use your existing FastAPI account to enter the refactored dashboard.
        </CardDescription>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="password123"
            required
          />
        </div>

        <Button className="w-full" size="lg" type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in
            </>
          ) : (
            "Enter dashboard"
          )}
        </Button>
      </form>
    </Card>
  );
}
