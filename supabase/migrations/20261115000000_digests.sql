-- Phase 2: one row per digest send. It is the audit trail, the exactly-once guard
-- (unique per user and window) and the record of which links each digest carried.

create type public.digest_status as enum ('pending', 'sent', 'failed');

create table public.digests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  window_start timestamptz not null,
  window_end timestamptz not null,
  channel text not null default 'email' check (channel in ('email')),
  link_ids uuid[] not null,
  status public.digest_status not null default 'pending',
  sent_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  -- A retry of the same Saturday reuses this row instead of sending a second digest.
  unique (user_id, window_start),
  check (window_end > window_start)
);

alter table public.digests enable row level security;

-- The owner may read their digest history; only the server's secret key writes rows.
create policy "digests read own" on public.digests
  for select to authenticated using (user_id = (select auth.uid()));
