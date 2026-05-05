import { defineConfig, devices } from "@playwright/test";

const backendPort = 8011;
const frontendPort = 3000;

export default defineConfig({
  testDir: "./tests/integration",
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: `http://127.0.0.1:${frontendPort}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: [
        "cd ..",
        "docker compose up -d postgres",
        "cd backend",
        "uv sync --python 3.14.2",
        `DATABASE_URL=postgresql+psycopg://resume:resume@127.0.0.1:5432/resume_optimizer OPTIMIZE_AI_MODE=local CORS_ORIGINS='[\"http://127.0.0.1:${frontendPort}\"]' uv run --python 3.14.2 uvicorn src.app.main:app --host 127.0.0.1 --port ${backendPort}`,
      ].join(" && "),
      url: `http://127.0.0.1:${backendPort}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      command: `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:${backendPort}/api/v1 npm run dev -- --hostname 127.0.0.1 --port ${frontendPort}`,
      url: `http://127.0.0.1:${frontendPort}/login`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
