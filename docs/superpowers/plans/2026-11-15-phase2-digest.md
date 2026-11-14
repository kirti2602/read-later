# Phase 2: Saturday email digest — Implementation Plan

> **For agentic workers:** native execution with parallel subagents for the pure-logic modules. Steps use `- [ ]`.

**Goal:** Every Saturday 09:00 IST, email the owner this week's unread links plus last week's leftovers, each with Open and a one-tap Done that needs no login.

**Architecture:** A new `src/digest/` feature holds pure logic (window and selection, signed Done tokens, email rendering) with tests, plus a runner that reads and writes with a server-only Supabase client. Supabase `pg_cron` + `pg_net` call `POST /api/cron/digest` at fixed IST times. Email goes through one `sendEmail` function backed by Resend. A `digests` table records every send and guarantees one digest per user per week.

**Tech Stack:** Next.js 16, Supabase (Postgres, `pg_cron`, `pg_net`, Vault), Resend HTTP API (no SDK), `node:crypto` HMAC.

**Spec:** `SPEC.md` (MVP 3: weekly digest; Reminder rules 1–3 and 5; Data model: `digests`). Owner decisions 2026-11-15: users are in IST, Sunday follow-up later, JavaScript-confirmed Done links, Resend now with the sender isolated.

## Global Constraints
- $0: Resend free plan (delivers only to the Resend account's own email without a verified domain); Supabase free scheduler; no paid services.
- Schedule (UTC in `pg_cron`): Saturday 03:30, 03:45, 04:00 = 09:00, 09:15, 09:30 IST. Each run sends only if this week's digest has not gone out. Deliberate shortcut: fixed IST times; upgrade path is a 15-minute "is it due?" check.
- Window: the digest covers the Saturday-09:00-to-Saturday-09:00 week that just ended; "From last week" adds unread links from the week before with `digest_count = 1`. Nothing to send means no email and no row.
- `SUPABASE_SECRET_KEY` is server-only (never `NEXT_PUBLIC_`), used only by the digest runner and the Done endpoint.
- Secrets live in `.env.local`, Vercel env and Supabase Vault; never in code, commits or chat.
- Email: inline styles, hex colours from the Hum tokens, system font stack, no images, no tracking redirects; every dynamic string HTML-escaped; only `http(s)` URLs become links.

## Review Focus
1. A crash between sending and recording must not send twice: the `digests` row is created first (`pending`), the Resend call carries the digest id as its idempotency key, then the row becomes `sent`.
2. Email security scanners must not mark links done: `/done/[token]` only marks done from JavaScript after load.
3. A forged, tampered or expired Done token does nothing and says so.
4. Titles containing HTML or quotes cannot break or inject into the email.
5. "Send test digest" must not use up Saturday's digest or change `digest_count`.

---

### Task 1: Database — `supabase/migrations/20261115000000_digests.sql`
- [ ] `digests` (id, user_id, window_start, window_end, channel `email`, link_ids uuid[], status `pending|sent|failed`, sent_at, error, created_at), unique (user_id, window_start), RLS read-own; writes only via the secret key.

### Task 2: Pure logic (TDD, subagent) — `src/digest/select.ts`, `src/digest/token.ts`
- [ ] `digestWindow(now, schedule) → { start, end, previousStart }`; `selectDigestLinks(links, window) → { fresh, carried }`.
- [ ] `signDoneToken({ linkId, userId }, secret, now?, ttlMs = 30 days)`, `verifyDoneToken(token, secret, now?) → payload | null`.

### Task 3: Email rendering (TDD, subagent) — `src/digest/email.ts`
- [ ] `renderDigestEmail({ appUrl, fresh, carried, doneUrl, isTest? }) → { subject, html, text }`.

### Task 4: Sending — `src/email/send.ts`
- [ ] `sendEmail({ to, subject, html, text, idempotencyKey }) → { id }` via Resend; the only file that knows the provider.

### Task 5: Runner and cron endpoint — `src/digest/run.ts`, `src/app/api/cron/digest/route.ts`
- [ ] Bearer `CRON_SECRET` (constant-time compare); for each user: skip if a `sent` row exists for the window; insert or reuse `pending`; send; mark `sent` and bump `digest_count` for the included links; record `failed` with the error otherwise.

### Task 6: One-tap Done — `src/app/done/[token]/page.tsx`, `src/app/api/done/route.ts`
- [ ] Page verifies the token server-side, then a client component POSTs to `/api/done` after load and shows "Marked done" with Undo; bad or expired tokens explain and link to the app.

### Task 7: Settings — `src/app/settings/page.tsx`
- [ ] Sidebar and phone nav link; shows the schedule (Saturdays 09:00 IST) and the inbox; "Send test digest" emails the current state marked as a test, with no `digests` row.

### Task 8: Schedule and verify — `supabase/migrations/2026111501…_digest_schedule.sql`
- [ ] Enable `pg_cron` and `pg_net`; three jobs read the app URL and cron secret from Vault and POST to the endpoint. Owner approves applying migrations and creating Vault secrets.
- [ ] Tests, typecheck, lint, build; send a test digest; trigger the cron endpoint once by hand; tap Done from the email; commit.
