import path from "node:path";

import { expect, test } from "@playwright/test";

const frontendDir = process.cwd();
const repoRoot = path.resolve(frontendDir, "..");
const backendOrigin = "http://127.0.0.1:8011";
const sampleResumePath = path.join(
  repoRoot,
  "backend",
  "src",
  "test",
  "fixtures",
  "sample_resume.pdf",
);

test("browser login, resume upload, optimization, and pdf download", async ({ page }) => {
  const email = `playwright-${Date.now()}@example.com`;
  const password = "password123";

  const registerResponse = await page.request.post(`${backendOrigin}/api/v1/auth/register`, {
    data: {
      name: "Playwright User",
      email,
      password,
    },
  });

  expect(registerResponse.ok()).toBeTruthy();

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Enter dashboard" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Playwright User" })).toBeVisible();

  await page.getByLabel("Resume file").setInputFiles(sampleResumePath);
  await page.getByRole("button", { name: "Upload resume" }).click();
  await expect(page.getByText("Resume uploaded.")).toBeVisible();
  await expect(page.getByRole("button", { name: /sample_resume\.pdf/i }).first()).toBeVisible();

  await page.getByLabel("Job title").fill("Backend Engineer");
  await page.getByLabel("Company").fill("Acme");
  await page.getByLabel("Source URL").fill("https://example.com/jobs/backend-engineer");
  await page.getByLabel("Job description").fill(
    "Need Python, FastAPI, Docker, and PostgreSQL experience building backend APIs.",
  );
  await page.getByRole("button", { name: "Save job posting" }).click();
  await expect(page.getByText("Job posting saved.")).toBeVisible();
  await expect(page.getByText("Backend Engineer").first()).toBeVisible();

  await page
    .getByLabel("Customization notes")
    .fill("Prioritize backend API delivery, measurable outcomes, and PostgreSQL work.");
  await page.getByRole("button", { name: "Run optimization" }).click();

  await expect(page.getByText("Optimization completed.")).toBeVisible();
  await expect(page.getByText("Add measurable impact for Python experience.")).toBeVisible();
  await expect(page.getByText("\\documentclass")).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PDF" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^optimized-resume-\d+\.pdf$/);

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);
});
