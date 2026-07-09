# Roam — AI Travel Planner

Tell Roam your dates and vibe in plain English (“3 relaxed days in Vancouver, love
food”) and it builds a day-by-day itinerary you can refine by chatting — with a
packing list, apps to download, local tips, and a budget. Grounded in verified
local facts (transit cards, plug types, emergency numbers) so it doesn't make
things up.

- **Repo:** https://github.com/dustymemo/travel-agent
- **License:** [MIT](./LICENSE)
- **Tracking:** Jira project **TA**

## Try it in 60 seconds (no accounts, no keys)

You need only **Node.js 20+**. This runs the app with a built-in **offline
planner**, so you don't need a Claude login or a database to see it work:

```bash
git clone https://github.com/dustymemo/travel-agent.git
cd travel-agent
npm install
echo "TRAVEL_AI_PROVIDER=fake" > .env.local   # use the offline demo planner
npm run dev
```

Open **http://localhost:3000**, type something like **“3 relaxed days in
Vancouver, love food”**, and hit send. Try the quick chips — *Make it cheaper*,
*Trains instead*, *Add a food tour*.

> ℹ️ In this demo mode the planner is **deterministic and canned** — it always
> returns a Vancouver-flavoured plan. To get real, any-city plans from Claude,
> do the [Full setup](#full-setup-real-ai--saved-trips) below.

## Status

Work is tracked as epics **E1–E10** in Jira. Progress so far:

- ✅ **E1 · Foundation** — Next.js 16 scaffold, pluggable AI provider, config, Zod
  schemas, Supabase clients + schema/RLS, Docker, test infra, **PWA**
- ✅ **E2 · City data** (Vancouver seed) — source-cited facts + the grounding the AI uses
- 🚧 **E3 · Core planner** — chat → live itinerary is **working** (offline planner);
  wiring the real `claude-cli` provider next
- ⬜ **E4** Budget · **E5** Map · **E6** Timeline UI · **E7** Save & eval ·
  **E8** Export · **E9** Booking links · **E10** Model-output evals

Conventions for contributors/agents live in [`AGENTS.md`](./AGENTS.md) (TDD is
mandatory; `src/lib/` stays framework-free).

## Architecture

One full-stack Next.js app, in three layers:

- **`src/lib/`** — the "brain": pure TypeScript, no React (AI provider, planner,
  budget, city data). Portable to a future native shell.
- **`src/components/`** — presentational UI.
- **`src/app/`** — routes (pages) + `api/` Route Handlers (the server backend that
  runs the AI provider).

The AI backend is **pluggable** (`src/lib/ai/`), chosen by `TRAVEL_AI_PROVIDER`:

| Value        | How it runs                                            | Needs                    |
| ------------ | ------------------------------------------------------ | ------------------------ |
| `fake`       | deterministic offline planner (demo/tests)             | nothing                  |
| `claude-cli` | local `claude` CLI, your Claude subscription (free)    | the `claude` CLI, logged in |
| `claude-api` | Claude API (Phase 2, not implemented yet)              | an API key               |

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind v4 · Zustand · Zod ·
Supabase (Postgres/Auth/Storage) · Vitest + Testing Library + MSW.

## Full setup (real AI + saved trips)

The demo above needs nothing. For real Claude-generated plans and saved trips,
add the two pieces it skips:

### 1. Real AI plans (the `claude` CLI)

Install the [`claude` CLI](https://docs.claude.com/en/docs/claude-code) and log in
with your Claude account (free for local dev), then in `.env.local`:

```bash
TRAVEL_AI_PROVIDER=claude-cli
```

Restart `npm run dev` and Roam plans **any** city, not just Vancouver.

### 2. Saved trips (Supabase)

Create a free project at https://supabase.com, then copy `.env.example` →
`.env.local` and fill in the keys from **Dashboard → Settings → API**:

```bash
cp .env.example .env.local
```

| Variable                        | Where to find it                                             |
| ------------------------------- | ------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | Settings → API → Project URL                                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → `anon` public key                           |
| `SUPABASE_SERVICE_ROLE_KEY`     | Settings → API → `service_role` key (server-only)            |

Then apply the database schema (tables + row-level security) with the Supabase
CLI — no global install needed:

```bash
npx supabase login                                   # opens a browser
npx supabase link --project-ref <your-project-ref>   # ref = subdomain of your Supabase URL
npx supabase db push                                 # applies supabase/migrations/0001_init.sql
```

- `link` / `db push` prompt for your **database password** (Settings → Database).
- No CLI? Paste `supabase/migrations/0001_init.sql` into the Dashboard → **SQL
  Editor** and run it once.
- Regenerate typed DB definitions after a schema change: `npm run db:types`.

`.env.local` is gitignored — never commit real keys.

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
JSON so planner logic is tested deterministically — no real Claude calls.
Coverage is gated on `src/lib/` (90% lines/stmts, 80% branches).

## Deploying

This is a **full-stack** app (server API routes + a server-side AI provider), so
it **can't** run on static hosts like GitHub Pages. Options:

- **Self-host (Phase 1, free):** Docker + the `claude` CLI —
  `claude setup-token` (copy into `.env` as `CLAUDE_CODE_OAUTH_TOKEN`), then
  `docker compose up --build`. Installable as a PWA on your phone. A subscription
  token is for **personal use** (Anthropic ToS + rate limits).
- **Vercel / serverless:** works for the app + API, but **can't run the `claude`
  CLI** — it needs the Phase-2 `claude-api` provider (not built yet). The `fake`
  planner does run there, for a UI demo.
