# Phase 1: Save and list — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (native execution chosen). Steps use `- [ ]` for tracking.

**Goal:** Paste a link into the web app, have it saved with title/site/thumbnail/type/minutes, and manage it in a three-view reading list (This week, Older unread, Done) behind a single login.

**Architecture:** Next.js 16 App Router app. Pure domain logic (URL canonicalising, week window, preview parsing) lives in `src/links/` with no framework imports and is unit tested. Supabase Postgres holds `users` and `links` with RLS; the browser session (Supabase Auth, cookies via `@supabase/ssr`) is the only auth in Phase 1. Save returns immediately; preview enrichment runs in `after()`.

**Tech Stack:** Next.js 16.4 (TS, App Router, `cacheComponents`), Tailwind 4, Supabase (`@supabase/supabase-js`, `@supabase/ssr`, CLI migrations), `node-html-parser`, Vitest.

**Spec:** `SPEC.md` (Phase 1 row of "Build plan"; "Data model"; "MVP features" 1–2).

## Global Constraints

- $0/month: Vercel Hobby, Supabase Free, no paid APIs (no YouTube Data API key).
- Single user; sign-ups disabled in Supabase; schema stays multi-user ready (`user_id` everywhere, RLS on `auth.uid()`).
- Week window = previous Saturday 09:00 → next Saturday 09:00 in the user's `timezone` (`digest_day = 6`, `digest_time = 09:00`).
- Duplicate = same `(user_id, canonical_url, window_start)`; second save returns the existing row with `already_saved`.
- `type` ∈ article / video / thread / other; `source` ∈ whatsapp / extension / share / web (Phase 1 writes `web`); `status` ∈ unread / done / deleted (delete is soft).
- Next 16: `src/proxy.ts` (not middleware); request data (`cookies`, `searchParams`) read inside `<Suspense>`; mutations call `refresh()`.
- Secrets only in `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Review Focus

1. Re-saving a link deleted earlier the same week → restored to unread, not "Already saved" on an invisible row. (Task 5)
2. Pasted URL without scheme (`example.com/post`) or with whitespace → saved as `https://…`; `javascript:`/`ftp:` rejected with 400. (Task 2)
3. Same article via `utm_*`/`#hash`/`www.`/`youtu.be`/`twitter.com` variant → treated as duplicate. (Task 2)
4. Page fetch fails/times out/returns non-HTML or huge body → link still saved, title falls back to hostname, no crash. (Task 4)
5. Saved Saturday 08:59 vs 09:00 local, and across a DST change for non-India users → lands in the right week. (Task 3)

---

### Task 1: Scaffold

**Files:** `package.json`, `vitest.config.ts`, `.env.local.example`, `.gitignore`, `src/app/layout.tsx`, `src/app/page.tsx`

- [ ] create-next-app (TS, App Router, `src/`, Tailwind, ESLint); add `@supabase/supabase-js @supabase/ssr node-html-parser`, dev `vitest`; script `"test": "vitest run"`.
- [ ] `.gitignore` keeps `.env*` ignored but allows `.env.local.example`.
- [ ] `npm run build && npm test` pass. Commit.

### Task 2: URL canonicalising — `src/links/canonicalize.ts`

**Produces:** `canonicalizeUrl(input: string): { url: string; canonicalUrl: string }` — throws `InvalidUrlError`.

- [ ] Tests: adds `https://` when no scheme; trims; rejects non-http(s) and garbage; lowercases host and strips `www.`/`m.`; drops `#hash`, `utm_*`, `fbclid`, `gclid`, `igshid`, `si`, `ref_src`; drops `s`/`t` only on x.com; sorts remaining params; drops trailing `/` (not root); `http`→`https`; `youtu.be/ID` and `youtube.com/shorts/ID` keep identity (`youtu.be/ID` → `youtube.com/watch?v=ID`); `twitter.com`/`mobile.twitter.com` → `x.com`.
- [ ] Implement with WHATWG `URL`. Tests pass. Commit.

### Task 3: Week window — `src/links/week-window.ts`

**Produces:** `windowStart(now: Date, opts: { timeZone: string; digestDay: number; digestTime: string }): Date` (digestTime `"HH:MM"` or `"HH:MM:SS"`, digestDay 0=Sun…6=Sat).

- [ ] Tests (Asia/Kolkata): Sat 2026-11-14 10:00 IST → `2026-11-14T03:30:00Z`; Sat 08:59 IST → `2026-11-07T03:30:00Z`; exactly 09:00 → same instant (inclusive); Fri 2026-11-20 → `2026-11-14T03:30:00Z`.
- [ ] Tests (America/New_York, DST ends 2026-11-01): Fri 2026-11-06 12:00 local → `2026-10-31T13:00:00Z`; Sat 2026-11-07 10:00 local → `2026-11-07T14:00:00Z`.
- [ ] Implement with `Intl.DateTimeFormat` parts + offset correction (no date library). Tests pass. Commit.

### Task 4: Preview fetcher — `src/links/metadata.ts`

**Produces:**
- `type LinkMetadata = { title: string | null; site: string | null; thumbnailUrl: string | null; type: LinkType; estMinutes: number | null }`
- `parseHtml(html: string, pageUrl: string): LinkMetadata & { durationSeconds: number | null }`
- `fetchMetadata(canonicalUrl: string, fetchImpl?: typeof fetch): Promise<LinkMetadata>` — never throws.

- [ ] Tests for `parseHtml`: `og:title` > `<title>`; `og:site_name` > hostname; relative `og:image` resolved against page URL; `og:type` `video.*` → video; article words/230 rounded, min 1; `itemprop="duration" PT1H2M30S` → 63 min.
- [ ] Tests for `fetchMetadata` with stub fetch: YouTube uses oEmbed title/author/thumbnail + watch-page duration, type video; `x.com/*/status/*` uses publish.twitter.com oEmbed, title = tweet text (≤120 chars), site "X", type thread; non-HTML content-type → type other, title null; fetch rejects/timeout → all null, type from URL.
- [ ] Implement: `AbortSignal.timeout(5000)`, read at most 2 MB, `node-html-parser`. Tests pass. Commit.

### Task 5: Database, auth, save API

**Files:** `supabase/migrations/20261114000000_init.sql`, `src/auth/supabase-server.ts`, `src/auth/current-user.ts`, `src/proxy.ts`, `src/app/login/{page.tsx,actions.ts,LoginForm.tsx}`, `src/links/types.ts`, `src/links/save-link.ts`, `src/app/api/links/route.ts`

**Produces:**
- `createServerSupabase(): Promise<SupabaseClient>`
- `getCurrentUser(db): Promise<AppUser | null>`; `AppUser = { id; email; timezone; digestDay; digestTime }`
- `saveLink(db, user: AppUser, rawUrl: string, source: LinkSource, now?: Date): Promise<{ link: Link; result: "saved" | "already_saved" | "restored" }>`
- `enrichLink(db, link: Link): Promise<void>` — writes metadata; title falls back to hostname.
- `POST /api/links` `{ url }` → 201 saved/restored, 200 already_saved, 400 invalid URL, 401 no session.

- [ ] Migration: enums, `users` (id → auth.users, timezone default `UTC`, digest_day 6, digest_time 09:00, followup_enabled false), `links` per spec + `window_start` and `unique (user_id, canonical_url, window_start)`, index `(user_id, status, saved_at desc)`, trigger creating `users` row on auth signup + backfill, RLS own-rows policies.
- [ ] Login: email/password server action; hidden field carries browser `Intl` timezone, validated and saved to `users.timezone`; sign-out action. Proxy refreshes session and redirects to `/login` when signed out (API returns 401 instead).
- [ ] `supabase db push`; manual: login works, wrong password shows error, curl without cookie → 401. Commit.

### Task 6: Reading list UI

**Files:** `src/links/queries.ts`, `src/links/actions.ts`, `src/links/components/{SaveForm,LinkItem,ViewTabs,LinkList}.tsx`, `src/app/page.tsx`

**Produces:** `listLinks(db, userId, view: "week" | "older" | "done", windowStart: Date): Promise<Link[]>`; actions `markDone(id)`, `deleteLink(id)`.

- [ ] week = unread & saved_at ≥ windowStart, newest first; older = unread & saved_at < windowStart; done = done, by done_at desc.
- [ ] Item: thumbnail, title (opens in new tab), site, type icon, "N min" / video length, Open, Done, Delete. Save form shows "Saved ✓" / "Already saved" / error, then refreshes.
- [ ] Manual: save article, YouTube, X post, duplicate, garbage; switch views; Done/Delete. Commit.

### Task 7: Verify and review

- [ ] `npm test && npm run lint && npm run build` clean; full manual pass as the user; one fresh whole-branch review; fix findings; commit.
