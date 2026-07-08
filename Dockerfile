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
RUN npm install -g @anthropic-ai/claude-code

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
