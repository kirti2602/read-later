-- Phase 1: users + links. digests arrives with Phase 2.

create type public.link_type as enum ('article', 'video', 'thread', 'other');
create type public.link_source as enum ('whatsapp', 'extension', 'share', 'web');
create type public.link_status as enum ('unread', 'done', 'deleted');

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  timezone text not null default 'UTC',
  digest_day smallint not null default 6 check (digest_day between 0 and 6), -- 0 = Sunday, 6 = Saturday
  digest_time time not null default '09:00',
  followup_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  url text not null,
  canonical_url text not null,
  title text,
  site text,
  thumbnail_url text,
  type public.link_type not null default 'other',
  est_minutes integer check (est_minutes > 0),
  note text,
  source public.link_source not null,
  status public.link_status not null default 'unread',
  saved_at timestamptz not null default now(),
  done_at timestamptz,
  digest_count smallint not null default 0 check (digest_count between 0 and 2),
  -- Start of the Saturday-to-Saturday window the link was saved in; part of the dedupe key.
  window_start timestamptz not null,
  unique (user_id, canonical_url, window_start)
);

create index links_user_status_saved_at on public.links (user_id, status, saved_at desc);

-- Every auth user gets a profile row; auth.users is written by Supabase, not the app.
create function public.handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.users (id, email) values (new.id, new.email) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Users created in the dashboard before this migration ran.
insert into public.users (id, email)
select id, email from auth.users
on conflict (id) do nothing;

alter table public.users enable row level security;
alter table public.links enable row level security;

create policy "users read own row" on public.users
  for select to authenticated using (id = (select auth.uid()));
create policy "users update own row" on public.users
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "links read own" on public.links
  for select to authenticated using (user_id = (select auth.uid()));
create policy "links insert own" on public.links
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "links update own" on public.links
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
