<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# How we work in this repo

Travel Agent — an AI travel planner (Next.js 16, full-stack). Jira project **TA**.

## 1. Test-Driven Development is mandatory

Every change follows **red → green → refactor**:

1. Write the **failing test first** (co-located `*.test.ts` next to the source).
2. Implement the minimum to pass.
3. Refactor with tests green.

- Runner: **Vitest** + Testing Library + MSW. Commands: `npm test`, `npm run test:watch`, `npm run test:coverage`, `npm run typecheck`.
- Coverage gate lives on `src/lib/` (90% lines/stmts, 80% branches). Thin I/O glue (`src/lib/ai/spawn.ts`, `src/lib/supabase/**`) is excluded — it's covered by integration/e2e, not units.
- **Never call real Claude in tests.** Use `FakeProvider` (`src/lib/ai/fake.ts`) — it implements the `TravelAIProvider` interface with canned JSON so planner/budget logic is deterministic. Validate real AI output against the **Zod** schemas in `src/types/`, never assert exact model prose.
- Definition of Done for every ticket includes tests-first.

## 2. Architecture — three layers, one rule

- **`src/lib/`** — the "brain": **pure TypeScript, NO React/Next imports.** AI, planner, budget, cities, weather, geo, supabase, config. This is what a future native/App Store shell reuses untouched. Keep it framework-free.
- **`src/components/`** — presentational UI only.
- **`src/app/`** — routes (pages) + `api/*/route.ts` Route Handlers (the server "backend": runs the AI provider, proxies weather/geo). Server-only work (the `claude` CLI, secrets) lives here, never in the browser.

The AI backend is **pluggable** (`src/lib/ai/`): `claude-cli` (Phase 1, free) ↔ `claude-api` (Phase 2). Select via `TRAVEL_AI_PROVIDER`; the app depends only on the `TravelAIProvider` interface.

## 3. Frontend standards (senior-frontend skill)

Apply the **`senior-frontend`** skill's standards (lives at `media-agent/.claude/skills/senior-frontend/`; read its `references/` for depth):

- **Server Components by default.** Add `'use client'` ONLY for event handlers, state, effects, or browser APIs. Keep client components small and at the leaves.
- **Semantic HTML + a11y:** real `<button>`/`<nav>`/`<main>`, keyboard-focusable interactive elements, `aria-label` for icon-only controls, `aria-hidden` on decorative icons, visible `focus-visible` rings, ≥4.5:1 contrast.
- **Class names:** use a `cn()` helper (clsx + tailwind-merge) once the design system lands (E6); don't hand-concatenate.
- **Images:** `next/image` with explicit width/height or `fill` + `sizes`; `priority` only above the fold.
- **Bundle discipline:** keep it lean (currently 100/100 on the analyzer). Prefer native `fetch` over axios, `date-fns`/`dayjs` over moment; add `experimental.optimizePackageImports` when introducing an icon lib.
- Extract reusable logic into custom hooks; prefer composition (compound components) over prop-drilling.

## 4. Conventions

- Defaults: **English, metric, CAD** — never hardcode; read from `src/lib/config.ts`.
- Domain types are **Zod-first** (`src/types/`): derive TS types from schemas, validate at boundaries.
- Deployment: Phase 1 = Docker + `claude` CLI (see `Dockerfile`, `README.md`); Phase 2 = Vercel + Claude API. Don't assume Vercel can run the CLI — it can't.
