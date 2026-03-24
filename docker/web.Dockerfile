# ------------------------------------------------------------------
# apps/web — Next.js App Router (standalone output)
# Multi-stage build for pnpm monorepo
# Context: repository root (docker build -f docker/web.Dockerfile .)
# ------------------------------------------------------------------

# ---- base ----
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate
WORKDIR /app

# ---- deps ----
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json              apps/web/package.json
COPY packages/ui/package.json           packages/ui/package.json
COPY packages/contracts/package.json    packages/contracts/package.json
COPY packages/tooling/package.json      packages/tooling/package.json
RUN pnpm install --frozen-lockfile

# ---- build ----
FROM deps AS build
COPY . .
RUN pnpm --filter @mmpi2/tooling build \
 && pnpm --filter @mmpi2/contracts build \
 && pnpm --filter @mmpi2/ui build \
 && pnpm --filter @mmpi2/web build

# ---- runner ----
FROM node:20-alpine AS runner
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs
WORKDIR /app

# Next.js standalone output copies everything needed into .next/standalone
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static     apps/web/.next/static
COPY --from=build /app/apps/web/public            apps/web/public

USER nextjs
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
