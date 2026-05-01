"use client";

import { login } from "@/lib/api";
import { storeSession } from "@/lib/auth-storage";

export async function apiRequestLogin(email: string, password: string) {
  const payload = await login(email, password);
  storeSession(payload);
  return payload;
}
