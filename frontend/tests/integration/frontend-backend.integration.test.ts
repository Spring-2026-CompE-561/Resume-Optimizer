import { readFileSync } from "node:fs";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const currentFile = fileURLToPath(import.meta.url);
const frontendDir = path.resolve(path.dirname(currentFile), "..", "..");
const repoRoot = path.resolve(frontendDir, "..");
const backendDir = path.join(repoRoot, "backend");
const backendPort = 8011;
const backendOrigin = `http://127.0.0.1:${backendPort}`;

let backendProcess: ReturnType<typeof spawn> | null = null;
let backendLogs = "";

async function runCommand(command: string, args: string[], cwd: string) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";

    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(output || `${command} exited with ${code}`));
      }
    });
  });
}

async function waitForHealthy(url: string) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Keep polling until the server is ready.
    }
    await delay(500);
  }

  throw new Error(`Backend did not become healthy.\n${backendLogs}`);
}

describe("frontend api integration", () => {
  beforeAll(async () => {
    try {
      await runCommand(
        "docker",
        ["inspect", "-f", "{{.State.Running}}", "resume-optimizer-postgres"],
        repoRoot,
      );
    } catch {
      await runCommand("docker", ["compose", "up", "-d", "postgres"], repoRoot);
    }

    backendProcess = spawn(
      "uv",
      [
        "run",
        "uvicorn",
        "src.app.main:app",
        "--host",
        "127.0.0.1",
        "--port",
        String(backendPort),
      ],
      {
        cwd: backendDir,
        env: {
          ...process.env,
          DATABASE_URL: "postgresql+psycopg://resume:resume@127.0.0.1:5432/resume_optimizer",
          OPTIMIZE_AI_MODE: "local",
          CORS_ORIGINS: '["http://127.0.0.1:3000"]',
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    backendProcess.stdout.on("data", (chunk) => {
      backendLogs += chunk.toString();
    });
    backendProcess.stderr.on("data", (chunk) => {
      backendLogs += chunk.toString();
    });

    process.env.NEXT_PUBLIC_API_BASE_URL = `${backendOrigin}/api/v1`;
    await waitForHealthy(`${backendOrigin}/health`);
  });

  afterAll(async () => {
    if (backendProcess) {
      backendProcess.kill("SIGINT");
      backendProcess = null;
      await delay(500);
    }
  });

  beforeEach(() => {
    window.localStorage.clear();
  });

  it("uploads a resume, creates a job posting, runs optimization, and downloads a PDF", async () => {
    const email = `integration-${Date.now()}@example.com`;
    const password = "password123";

    const registerResponse = await fetch(`${backendOrigin}/api/v1/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Integration User",
        email,
        password,
      }),
    });

    expect(registerResponse.ok).toBe(true);
    const registerPayload = await registerResponse.json();

    const { buildApiUrl, createJobPosting, fetchOptimizations, runOptimization, uploadResume } =
      await import("@/lib/api");
    const { readAccessToken, storeSession } = await import("@/lib/auth-storage");

    storeSession(registerPayload);

    const sampleResume = readFileSync(
      path.join(backendDir, "src", "test", "fixtures", "sample_resume.pdf"),
    );
    const file = new File([sampleResume], "sample_resume.pdf", {
      type: "application/pdf",
    });

    const resume = await uploadResume(file);
    const jobPosting = await createJobPosting({
      title: "Backend Engineer",
      company: "Acme",
      description:
        "Need Python, FastAPI, Docker, and PostgreSQL experience building backend APIs.",
    });
    const optimization = await runOptimization({
      resume_id: resume.id,
      job_posting_id: jobPosting.id,
      customization_notes: "Prioritize backend API delivery and metrics.",
    });

    expect(optimization.latex_content).toContain("\\documentclass");
    expect(optimization.optimized_resume_text).toContain("Summary");
    expect(optimization.pdf_download_url).toContain("/api/v1/optimize/");

    const history = await fetchOptimizations();
    expect(history.some((item) => item.id === optimization.id)).toBe(true);

    const pdfResponse = await fetch(buildApiUrl(optimization.pdf_download_url ?? ""), {
      headers: {
        Authorization: `Bearer ${readAccessToken()}`,
      },
    });

    expect(pdfResponse.ok).toBe(true);
    expect(pdfResponse.headers.get("content-type")).toContain("application/pdf");
  });
});
