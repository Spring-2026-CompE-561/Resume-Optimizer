"use client";

import { buildApiUrl } from "@/lib/api";
import { readAccessToken } from "@/lib/auth-storage";

export async function downloadAuthenticatedFile(url: string, fileName: string) {
  const response = await fetch(buildApiUrl(url), {
    headers: {
      Authorization: `Bearer ${readAccessToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error("Download failed.");
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
