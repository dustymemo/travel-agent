# Travel Agent

AI travel planner. Enter a destination, number of days, season, and budget (CAD),
and it generates a day-by-day timeline, packing list (clothes/ID), apps to download
(e.g. Compass Card in Vancouver, Suica in Japan), seasonal tips grounded in real
weather, a budget breakdown, a map route, and exports (PDF + a 9:16 full-screen
phone visual).

- **Repo:** https://github.com/dustymemo/travel-agent (private)
- **Tracking:** Jira project **TA**

## Status

Work is tracked as epics **E1–E10** in Jira. Progress so far:

- ✅ **E1 · Foundation** — Next.js 16 scaffold, pluggable AI provider (`claude-cli` /
  `claude-api`), config, Zod schemas, Supabase clients, Docker, test infra, **PWA**
  (installable + offline)
- 🚧 **E2 · City data** (Vancouver seed) — in progress
- ⬜ **E3** Core planner · **E4** Budget · **E5** Map · **E6** Timeline UI ·
  **E7** Save & eval · **E8** Export · **E9** Booking links · **E10** Model-output evals

Conventions for contributors/agents live in [`AGENTS.md`](./AGENTS.md) (TDD is
mandatory; `src/lib/` stays framework-free). Reusable `senior-*` skills are vendored
under `.claude/skills/`.

## Architecture

One full-stack Next.js app, in three layers:

- **`src/lib/`** — the "brain": pure TypeScript, no React (AI provider, planner,
  budget, city data, weather, geo, supabase). Portable to a future native shell.
- **`src/components/`** — presentational UI.
- **`src/app/`** — routes (pages) + `api/` Route Handlers (the server backend:
  runs the AI provider, proxies weather/geo).

The AI backend is **pluggable** (`src/lib/ai/`):

| Phase | Provider    | How it runs                                          | Cost         |
| ----- | ----------- | ---------------------------------------------------- | ------------ |
| 1     | `claude-cli`| local `claude` CLI / Docker, your Gmail subscription | $0           |
| 2     | `claude-api`| Claude API on Vercel (later)                         | pennies/plan |

Switch with `TRAVEL_AI_PROVIDER`. See `.env.example`.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind v4 · Zustand · Zod ·
Supabase (Postgres/Auth/Storage) · Leaflet + OpenStreetMap · Open-Meteo ·
Vitest + Testing Library + MSW.

## Development

```bash
npm install
cp .env.example .env.local   # fill in Supabase; CLI uses your local `claude` login
npm run dev                  # http://localhost:3000
```

### Test-driven development

This project is **TDD**: write the failing test first, then implement, then refactor.

```bash
npm test            # run once
npm run test:watch  # watch mode
npm run test:coverage
npm run typecheck
```

A `FakeProvider` (`src/lib/ai/fake.ts`) implements the AI interface with canned
JSON so planner/budget logic is tested deterministically — no real Claude calls.

## Phase 1 deploy (self-host, free)

```bash
# 1. Authenticate the CLI once with your Claude (Gmail) account, then:
claude setup-token          # copy the token into .env as CLAUDE_CODE_OAUTH_TOKEN
# 2. Run it:
docker compose up --build   # http://localhost:3000 — installable as a PWA on your phone
```

> A subscription token is for **personal use** (Anthropic ToS + subscription rate
> limits). For a public, multi-user version, switch to `claude-api` (Phase 2).
