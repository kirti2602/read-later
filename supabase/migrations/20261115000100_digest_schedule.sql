-- Phase 2 schedule: Supabase calls the app's digest endpoint every Saturday morning.
-- The app URL and the shared secret live in Supabase Vault (created once by hand, never
-- committed): `app_url` and `digest_cron_secret`.

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

create or replace function public.trigger_digest() returns bigint
language plpgsql security definer set search_path = '' as $$
declare
  base_url text := (select decrypted_secret from vault.decrypted_secrets where name = 'app_url');
  secret text := (select decrypted_secret from vault.decrypted_secrets where name = 'digest_cron_secret');
begin
  if base_url is null or secret is null then
    raise exception 'Vault secrets app_url and digest_cron_secret must exist before the digest can run';
  end if;
  return net.http_post(
    url := base_url || '/api/cron/digest',
    headers := jsonb_build_object('Authorization', 'Bearer ' || secret, 'Content-Type', 'application/json'),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
end;
$$;

-- Functions in public are callable through the API by default; only the scheduler may run this.
revoke all on function public.trigger_digest() from public, anon, authenticated;

-- yagni: every user is in IST, so the times are fixed (09:00, 09:15 and 09:30 IST in UTC).
-- The later two are retries; the endpoint sends nothing twice. Upgrade path for other
-- timezones: one job every 15 minutes, with the endpoint deciding who is due.
select cron.schedule('digest-0900-ist', '30 3 * * 6', 'select public.trigger_digest()');
select cron.schedule('digest-0915-ist', '45 3 * * 6', 'select public.trigger_digest()');
select cron.schedule('digest-0930-ist', '0 4 * * 6', 'select public.trigger_digest()');
