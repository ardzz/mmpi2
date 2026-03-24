# ------------------------------------------------------------------
# apps/worker — NestJS BullMQ background worker
# Multi-stage build for pnpm monorepo
# Context: repository root (docker build -f docker/worker.Dockerfile .)
# ------------------------------------------------------------------

# ---- base ----
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate
WORKDIR /app

# ---- deps ----
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/worker/package.json           apps/worker/package.json
COPY packages/reports/package.json      packages/reports/package.json
COPY packages/contracts/package.json    packages/contracts/package.json
COPY packages/config/package.json       packages/config/package.json
COPY packages/db/package.json           packages/db/package.json
COPY packages/tooling/package.json      packages/tooling/package.json
RUN pnpm install --frozen-lockfile

# ---- build ----
FROM deps AS build
COPY . .
RUN pnpm --filter @mmpi2/tooling build \
 && pnpm --filter @mmpi2/contracts build \
 && pnpm --filter @mmpi2/config build \
 && pnpm --filter @mmpi2/reports build \
 && pnpm --filter @mmpi2/worker build

# ---- prod-deps ----
FROM base AS prod-deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/worker/package.json           apps/worker/package.json
COPY packages/reports/package.json      packages/reports/package.json
COPY packages/contracts/package.json    packages/contracts/package.json
COPY packages/config/package.json       packages/config/package.json
COPY packages/db/package.json           packages/db/package.json
COPY packages/tooling/package.json      packages/tooling/package.json
RUN pnpm install --frozen-lockfile --prod

# ---- runner ----
FROM node:20-alpine AS runner
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nestjs
WORKDIR /app

COPY --from=prod-deps /app/ ./

COPY --from=build /app/apps/worker/dist           apps/worker/dist
COPY --from=build /app/packages/reports/dist       packages/reports/dist
COPY --from=build /app/packages/contracts/dist     packages/contracts/dist
COPY --from=build /app/packages/config/dist        packages/config/dist
COPY --from=build /app/packages/tooling/dist       packages/tooling/dist

# Prisma schema + generated client (if worker accesses DB directly)
COPY --from=build /app/packages/db/prisma          packages/db/prisma
COPY --from=build /app/packages/db/dist            packages/db/dist
COPY --from=build /app/packages/db/src/generated   packages/db/src/generated

USER nestjs
ENV NODE_ENV=production
CMD ["node", "apps/worker/dist/main.js"]
