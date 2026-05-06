import { AuthForm, type AuthMode } from "@/components/auth-form";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const mode: AuthMode = params.mode === "signup" ? "signup" : "signin";

  return <AuthForm mode={mode} />;
}
