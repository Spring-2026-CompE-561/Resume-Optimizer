# Team Dependencies and Execution Order

This document explains how each backend owner connects to the others, what must be built first, and which tasks are blocked until prerequisites are complete.

## Roles

- Alden Cam: Auth + token lifecycle.
- Amarjot Sandhu: Resume ingestion pipeline.
- Eren Ugur: Job posting + scraping + keywords.
- John Hayali: Optimize pipeline.
- Remington Steele: Platform foundation + migrations + middleware + CI.

## Dependency Graph (High Level)

1. Remington foundation -> unlocks everyone.
2. Alden auth -> required for all protected route testing.
3. Amarjot resumes and Eren job postings -> can run in parallel after 1 and 2.
4. John optimize -> depends on Amarjot + Eren data paths and Alden auth.
5. Remington final integration hardening -> depends on all route implementations.

## What Must Happen First

## Step 1: Platform Baseline (Remington)
- Create app bootstrap and router wiring.
- Set database session and Alembic baseline migration.
- Implement shared error schema + global handler.

Why first:
- Other members need app wiring, DB models, and error contracts to avoid rework.

## Step 2: Auth Core (Alden)
- Implement signup/login/me and token utilities.
- Provide reusable dependency for current-user extraction.

Why second:
- Resume, job posting, and optimize routes are protected and require auth context.

## Step 3: Domain Pipelines in Parallel (Amarjot + Eren)
- Amarjot: resume upload/parse CRUD.
- Eren: job posting scrape/keyword CRUD.

Why parallel:
- Minimal overlap beyond shared auth and base model conventions.
- Both outputs are needed for optimization.

## Step 4: Optimize Pipeline (John)
- Implement optimize endpoint using:
  - parsed resume from Amarjot path
  - job description + keywords from Eren path
  - auth user context from Alden path

Why fourth:
- Optimize cannot be reliable until upstream resume/job data contracts are stable.

## Step 5: Full Integration + Hardening (Remington + everyone)
- Remington runs final migration checks, middleware checks, and CI gate setup.
- Everyone fixes cross-route inconsistencies found in integration tests.

## Team-to-Team Interfaces

## Alden -> Amarjot/Eren/John
- Provides `get_current_user` dependency and token verification API.
- Publishes auth error codes and expected 401 behavior.

## Remington -> Everyone
- Provides app startup pattern, router registration rules, DB session dependency, and error envelope middleware.
- Publishes migration naming and review process.

## Amarjot + Eren -> John
- Publish stable schema fields for:
  - resume parsed text
  - job description
  - keyword list with scores
- Provide fixture data for optimize integration tests.

## Merge and Handoff Rules

1. No one merges route code without matching schema and tests.
2. Shared contracts (`error`, auth dependency, model keys) are reviewed by at least one dependent teammate.
3. John starts final optimize route only after Amarjot + Eren expose stable repository/service interfaces.
4. Remington runs final integration matrix before submission.

## Blocking Risks and Mitigation

- Risk: migration conflicts.
  - Mitigation: Remington owns migration sequencing and rebases migration heads.
- Risk: inconsistent error payloads.
  - Mitigation: enforce response helpers and error middleware early.
- Risk: optimize contract churn.
  - Mitigation: freeze resume/job repository return shapes before John finalizes prompt builder.

## Minimal Weekly Sequence

1. Day 1-2: Remington baseline + Alden auth start.
2. Day 3-5: Amarjot and Eren build and test domain routes.
3. Day 6-7: John optimize integration with fixture data.
4. Final 2 days: system integration, bug fixing, and test hardening across team.

