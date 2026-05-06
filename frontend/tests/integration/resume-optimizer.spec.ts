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

test("browser login, management pages, workflow, and history all work", async ({ page }) => {
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
  await expect(page).toHaveURL(/\/auth\?mode=signin$/);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByLabel("Password").press("Enter");

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("Playwright User")).toBeVisible();
  await expect(page.getByText("Welcome back, Playwright")).toBeVisible();

  await page.goto("/dashboard/resumes");
  await expect(page).toHaveURL(/\/dashboard\/resumes$/);
  await page.locator("#resume-upload-input").setInputFiles(sampleResumePath);
  await page.locator("form").locator('button[type="submit"]').click();
  await expect(page.getByText("Resume uploaded.")).toBeVisible();
  await expect(page.getByRole("link", { name: /sample_resume\.pdf/i })).toBeVisible();

  await page.getByRole("button", { name: "Select" }).first().click();
  await expect(page.getByText("Resume selected for optimization.")).toBeVisible();

  await page.goto("/dashboard/jobs");
  await expect(page).toHaveURL(/\/dashboard\/jobs$/);
  await expect(page.getByLabel("Source URL")).not.toBeVisible();
  await page.getByLabel("Job Title").fill("Backend Engineer");
  await page.getByLabel("Company").fill("Acme");
  await page.getByLabel("Job Description").fill(
    "Need Python, FastAPI, Docker, and PostgreSQL experience building backend APIs.",
  );
  await page.getByRole("button", { name: "Save role" }).click();
  await expect(page.getByText("Role saved.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Backend Engineer" })).toBeVisible();

  await page.getByRole("button", { name: "Select" }).first().click();
  await expect(page.getByText("Role selected for optimization.")).toBeVisible();

  await page.goto("/dashboard/workflow");
  await expect(page).toHaveURL(/\/dashboard\/workflow$/);
  await page
    .getByPlaceholder("Add any additional context or specific areas to focus on...")
    .fill("Prioritize backend API delivery, measurable outcomes, and PostgreSQL work.");
  await page.getByRole("button", { name: "Generate optimized draft" }).click();

  await expect(page).toHaveURL(/\/dashboard\/results\/\d+$/);
  await expect(page.getByRole("heading", { name: "Optimization Result" })).toBeVisible();
  await expect(page.getByText("Targeted Resume Draft")).toBeVisible();
  await page.getByRole("button", { name: "Apply suggestion" }).first().click();
  await expect(page.getByRole("button", { name: "Applied" }).first()).toBeVisible();
  await expect(page.getByText("Applied Improvements")).toBeVisible();
  await page.getByRole("button", { name: /Apply all/ }).click();
  await expect(page.getByRole("button", { name: "All applied" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("\\documentclass");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PDF" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^optimized-resume-\d+\.pdf$/);

  await page.goto("/dashboard/history");
  await expect(page).toHaveURL(/\/dashboard\/history$/);
  await expect(page.getByRole("heading", { name: "Optimization History" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Backend Engineer Acme/ }).first()).toBeVisible();

  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/auth\?mode=signin$/);

  await page.goto("/signup");
  await expect(page).toHaveURL(/\/auth\?mode=signup$/);
});
