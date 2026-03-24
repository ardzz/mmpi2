# MMPI-2 Clinical Assessment Platform

Modular monolith for patient intake, MMPI-2 assessment delivery, deterministic scoring, doctor review/publication, and clinical report generation.

## Stack

| Layer | Technology |
|-------|-----------|
| Web client | Next.js 15 (App Router) |
| API server | NestJS 10 |
| Worker | NestJS + BullMQ |
| ORM / migrations | Prisma 6 |
| Database | PostgreSQL |
| Object storage | MinIO (local) |
| Cache / queues | Redis |
| Language | TypeScript (strict) |
| Monorepo | pnpm workspaces + Turborepo |
| Linting | Biome |

## Workspace Structure

```
apps/
  web/          Next.js App Router — patient, doctor, admin UI
  api/          NestJS — REST API, auth, RBAC, workflow orchestration
  worker/       NestJS — BullMQ job processing, PDF generation

packages/
  auth/         Role constants, RBAC matrix, permission checks
  config/       Versioned MMPI-2 question bank and scoring config metadata
  contracts/    Shared Zod schemas, DTOs, state machine rules
  db/           Prisma schema, generated client, migration/seed helpers
  reports/      Report data models, PDF composition templates
  scoring/      Pure deterministic scoring engine (zero framework deps)
  tooling/      Shared tsconfig presets and build tooling
  ui/           Shared UI components (shadcn/ui based)
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Run all linters
pnpm lint

# Type-check the entire workspace
pnpm typecheck

# Run all tests
pnpm test

# Run a specific package
pnpm --filter @mmpi2/scoring test

# Start development servers
pnpm dev
```

## MVP Scope

This platform targets the core clinical workflow:

- Patient registration, profile completion, assessment request creation
- Doctor assignment, admin approval, session activation
- MMPI-2 assessment delivery with autosave
- Deterministic scoring with frozen version references
- Doctor review, interpretation, sign-off, and report publication
- PDF report generation via background worker
- Admin operational control (billing settings, user management, audit)

## Explicit MVP Exclusions

The following are intentionally excluded from the MVP build:

- **GraphQL / tRPC** — REST-only API surface
- **WebSocket / SSE** — autosave uses plain HTTP writes
- **Storybook** — component development deferred
- **i18n framework** — single-language MVP
- **Chart libraries** — tabular scores and narrative summaries only
- **OpenTelemetry** — observability deferred to post-MVP hardening
- **Microservices split** — modular monolith architecture
- **Multi-tenant architecture** — single-clinic singleton settings
- **Bulk rescoring** — individual session scoring only
- **Provider-specific payment code** — gateway-ready abstraction with NullGateway active
- **Email delivery** — notification events recorded but delivery deferred
- **Certificate generation** — schema present, rendering deferred
