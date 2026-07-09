# Phase 1 image: Next.js (standalone) + the `claude` CLI.
# The CLI runs AI generation on your Gmail-linked Claude subscription,
# authenticated headlessly via CLAUDE_CODE_OAUTH_TOKEN (from `claude setup-token`).

FROM node:22-slim AS base

# ── deps ──
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── build ──
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ── runtime ──
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV TRAVEL_AI_PROVIDER=claude-cli

# The claude CLI must exist in the container for the claude-cli provider.
# Installed as root (global), before we drop privileges below.
RUN npm install -g @anthropic-ai/claude-code

# Run as the unprivileged `node` user (uid 1000) that ships with the base image,
# not root. App files are owned by node so nothing runs or writes as root.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

USER node

EXPOSE 3000

# Liveness probe hits /api/health using node's built-in fetch (no curl in slim).
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
