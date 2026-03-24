# ------------------------------------------------------------------
# apps/api — NestJS API server
# Multi-stage build for pnpm monorepo
# Context: repository root (docker build -f docker/api.Dockerfile .)
# ------------------------------------------------------------------

# ---- base: shared runtime image ----
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate
WORKDIR /app

# ---- deps: install production + dev dependencies (for build) ----
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json              apps/api/package.json
COPY packages/auth/package.json         packages/auth/package.json
COPY packages/config/package.json       packages/config/package.json
COPY packages/contracts/package.json    packages/contracts/package.json
COPY packages/db/package.json           packages/db/package.json
COPY packages/scoring/package.json      packages/scoring/package.json
COPY packages/tooling/package.json      packages/tooling/package.json
RUN pnpm install --frozen-lockfile

# ---- build: compile all packages then the api app ----
FROM deps AS build
COPY . .
RUN pnpm --filter @mmpi2/tooling build \
 && pnpm --filter @mmpi2/contracts build \
 && pnpm --filter @mmpi2/config build \
 && pnpm --filter @mmpi2/auth build \
 && pnpm --filter @mmpi2/scoring build \
 && pnpm --filter @mmpi2/api build

# ---- prod-deps: production-only node_modules ----
FROM base AS prod-deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json              apps/api/package.json
COPY packages/auth/package.json         packages/auth/package.json
COPY packages/config/package.json       packages/config/package.json
COPY packages/contracts/package.json    packages/contracts/package.json
COPY packages/db/package.json           packages/db/package.json
COPY packages/scoring/package.json      packages/scoring/package.json
COPY packages/tooling/package.json      packages/tooling/package.json
RUN pnpm install --frozen-lockfile --prod

# ---- runner: minimal production image ----
FROM node:20-alpine AS runner
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nestjs
WORKDIR /app

# Copy production node_modules tree
COPY --from=prod-deps /app/ ./

# Copy built dist outputs for each workspace package the api depends on
COPY --from=build /app/apps/api/dist           apps/api/dist
COPY --from=build /app/packages/auth/dist      packages/auth/dist
COPY --from=build /app/packages/config/dist    packages/config/dist
COPY --from=build /app/packages/contracts/dist packages/contracts/dist
COPY --from=build /app/packages/scoring/dist   packages/scoring/dist
COPY --from=build /app/packages/tooling/dist   packages/tooling/dist

# Copy Prisma schema + generated client (needed at runtime)
COPY --from=build /app/packages/db/prisma      packages/db/prisma
COPY --from=build /app/packages/db/dist        packages/db/dist
COPY --from=build /app/packages/db/src/generated packages/db/src/generated

USER nestjs
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]
