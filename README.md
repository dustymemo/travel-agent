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
  `claude-api`), config, Zod schemas, Supabase clients + schema/RLS, Docker, test
  infra, **PWA** (installable + offline)
- ✅ **E2 · City data** (Vancouver seed) — source-cited `CityData`, loader, and the
  `cityFactsForPrompt()` fragment that grounds the AI
- 🚧 **E3 · Core planner** — next up
- ⬜ **E4** Budget · **E5** Map · **E6** Timeline UI · **E7** Save & eval ·
  **E8** Export · **E9** Booking links · **E10** Model-output evals

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

## Getting started

### Prerequisites

- **Node.js 20+** and npm
- A free **Supabase** project — https://supabase.com (for the database + auth)
- **Phase 1 AI:** the [`claude` CLI](https://docs.claude.com/en/docs/claude-code)
  logged in with your Claude (Gmail) account (`claude` local dev is free)
- **Optional:** Docker Desktop (only for the containerized deploy)

### 1. Install

```bash
git clone https://github.com/dustymemo/travel-agent.git
cd travel-agent
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable                        | Where to find it                                              |
| ------------------------------- | ------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase Dashboard → **Settings → API** → Project URL        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → **Settings → API** → `anon` public key  |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase Dashboard → **Settings → API** → `service_role` key |
| `TRAVEL_AI_PROVIDER`            | Leave `claude-cli` for local dev (uses your logged-in CLI)   |

`.env.local` is gitignored — never commit real keys.

### 3. Set up the database

The schema (tables + row-level security) lives in `supabase/migrations/`. Apply it
to **your** Supabase project with the Supabase CLI (run via `npx` — no global install
needed):

```bash
npx supabase login                                   # opens a browser to authenticate
npx supabase link --project-ref <your-project-ref>   # links this repo to your project
npx supabase db push                                 # applies migrations to the remote DB
```

- **`<your-project-ref>`** is the 20-character id in your project URL —
  `https://<your-project-ref>.supabase.co` (same as the subdomain in
  `NEXT_PUBLIC_SUPABASE_URL`).
- `link` / `db push` prompt for your **database password**
  (Supabase Dashboard → **Settings → Database**; "Reset database password" if
  you don't have it saved).
- `db push` applies [`0001_init.sql`](./supabase/migrations/0001_init.sql), which
  creates the `trips` and `feedback` tables, enables RLS, and adds owner-scoped
  policies. **Until this runs, the app has no tables and RLS protects nothing.**

After any schema change, regenerate the typed database definitions:

```bash
npm run db:types    # writes src/types/supabase.ts from the linked project
```

> No CLI? You can instead paste the contents of
> `supabase/migrations/0001_init.sql` into the Supabase Dashboard → **SQL Editor**
> and run it once.

### 4. Run the app

```bash
npm run dev         # http://localhost:3000
```

## Test-driven development

This project is **TDD**: write the failing test first, then implement, then refactor.

```bash
npm test            # run the suite once
npm run test:watch  # watch mode
npm run test:coverage
npm run typecheck   # tsc --noEmit
npm run lint
```

A `FakeProvider` (`src/lib/ai/fake.ts`) implements the AI interface with canned
JSON so planner/budget logic is tested deterministically — no real Claude calls.
Coverage is gated on `src/lib/` (90% lines/stmts, 80% branches).

## Phase 1 deploy (self-host, free)

```bash
# 1. Authenticate the CLI once with your Claude (Gmail) account, then:
claude setup-token          # copy the token into .env as CLAUDE_CODE_OAUTH_TOKEN
# 2. Run it:
docker compose up --build   # http://localhost:3000 — installable as a PWA on your phone
```

> A subscription token is for **personal use** (Anthropic ToS + subscription rate
> limits). For a public, multi-user version, switch to `claude-api` (Phase 2).
