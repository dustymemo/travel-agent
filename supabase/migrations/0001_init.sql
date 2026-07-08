-- TA-37: Supabase schema + Row-Level Security for Travel Agent.
--
-- Run in the Supabase SQL editor (Dashboard → SQL) or via `supabase db push`
-- if you adopt the CLI. RLS is enabled on every table and the default-deny
-- posture means the browser anon key can only ever touch the signed-in user's
-- own rows. Do NOT add permissive policies without an owner check.

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper: keep updated_at fresh on every UPDATE.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- trips: one saved trip = the user's input + generated itineraries (Trip JSON).
-- The itinerary shape is validated in TypeScript (Zod, src/types/trip.ts); we
-- store it as jsonb so the schema can evolve without migrations.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.trips (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null default 'Untitled trip',
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists trips_user_id_idx on public.trips (user_id);

create trigger trips_set_updated_at
  before update on public.trips
  for each row execute function public.set_updated_at();

alter table public.trips enable row level security;

create policy "trips are selectable by owner"
  on public.trips for select
  using (auth.uid() = user_id);

create policy "trips are insertable by owner"
  on public.trips for insert
  with check (auth.uid() = user_id);

create policy "trips are updatable by owner"
  on public.trips for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "trips are deletable by owner"
  on public.trips for delete
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- feedback: per-section eval capture (TA-30) — thumbs + flag wrong/right — used
-- to measure and improve AI output quality over time.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  trip_id     uuid references public.trips (id) on delete cascade,
  section     text not null,                 -- e.g. "itinerary.day.2", "budget"
  verdict     text not null check (verdict in ('up', 'down', 'flag')),
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists feedback_user_id_idx on public.feedback (user_id);
create index if not exists feedback_trip_id_idx on public.feedback (trip_id);

alter table public.feedback enable row level security;

create policy "feedback is selectable by owner"
  on public.feedback for select
  using (auth.uid() = user_id);

create policy "feedback is insertable by owner"
  on public.feedback for insert
  with check (auth.uid() = user_id);

create policy "feedback is updatable by owner"
  on public.feedback for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "feedback is deletable by owner"
  on public.feedback for delete
  using (auth.uid() = user_id);
