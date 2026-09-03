# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps

WORKDIR /app

# Default keeps the official registry; pass --build-arg NPM_REGISTRY to switch
# (e.g. https://registry.npmmirror.com) when the build host cannot reach it.
ARG NPM_REGISTRY=https://registry.npmjs.org
ENV NPM_CONFIG_REGISTRY=${NPM_REGISTRY}

RUN corepack enable && corepack prepare pnpm@11.25.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS builder

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_API_MODE=real
ARG NEXT_PUBLIC_API_BASE_URL=/api/v1
ENV NEXT_PUBLIC_API_MODE=${NEXT_PUBLIC_API_MODE}
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

# The service name is resolvable on the Compose network and is also baked into
# Next's server-side rewrite configuration during `next build`.
ARG BACKEND_ORIGIN=http://backend:8000
ENV BACKEND_ORIGIN=${BACKEND_ORIGIN}

RUN pnpm build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# `output: standalone` keeps the runtime image limited to the Next server and
# the traced production dependencies.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
