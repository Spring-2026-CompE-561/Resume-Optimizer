# Resume Optimizer

Resume Optimizer is a full-stack system for tailoring resumes to job descriptions.

## Stack

- Frontend: Next.js 16.2.4, Tailwind CSS, ShadCN-style UI primitives
- Backend: FastAPI with `uv`
- Database: PostgreSQL via `docker compose`

## Core Flow

1. Upload a PDF or DOCX resume.
2. Parse it into plaintext.
3. Save or scrape a target job description.
4. Generate an optimized resume draft.
5. Store the generated LaTeX and PDF artifacts.
6. Review the LaTeX in the browser and download the PDF.

## Local Development

1. Start the full stack with Docker:

   ```bash
   docker compose up
   ```

   The app will be available at `http://localhost:3000`, the API at `http://localhost:8000`,
   and PostgreSQL at `localhost:5432`.

2. Run the services manually instead:

   ```bash
   docker compose up -d postgres
   cd backend
   uv sync
   uv run uvicorn src.app.main:app --reload
   ```

3. Start the frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

See `instructions.md` for the patch-based handoff flow, testing commands, and validation steps.
