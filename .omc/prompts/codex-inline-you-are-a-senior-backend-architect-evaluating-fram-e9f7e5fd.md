You are a senior backend architect evaluating framework choices for a clinical workflow platform (MMPI-2 MVP). 

The platform has:
- RBAC with policy-heavy access control (clinicians, admins, patients, billing roles)
- State-machine gates (assessment → scoring → review → report → publish)
- Background jobs (scoring orchestration, report generation, webhook delivery)
- Billing/webhooks (Stripe integration, retry logic)
- Large domain modules (assessments, scoring, reports, users, billing, notifications)
- Modular monolith architecture target
- Blueprint-driven execution (plans are written before code; consistency matters)

The question: **NestJS vs Hono** for this domain.

Evaluate both frameworks across these dimensions:
1. Module system / domain organization (monolith readiness)
2. RBAC / Guards / Policy enforcement patterns
3. Validation pipeline (class-validator, zod, etc.)
4. Background jobs (BullMQ, queues, cron)
5. Dependency Injection and testability
6. Middleware / interceptors for audit logging, state-machine enforcement
7. Blueprint execution consistency (how well does the framework enforce architectural contracts?)
8. Production operational maturity (error handling, health checks, OpenAPI)

Be specific about what Hono lacks vs what NestJS provides for each dimension. Return a clear recommendation with risk summary if the team deviates to Hono mid-plan.