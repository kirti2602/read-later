# Phase 3: Capture anywhere — Implementation Plan

> **For agentic workers:** native execution; the Chrome extension is built by a subagent in its own folder. Steps use `- [ ]`.

**Goal:** Save a link in at most two taps from Android (share sheet), iPhone (Shortcut) and the laptop (Chrome extension), using each person's normal login, at $0.

**Architecture:** One save page, `/share?url=…`, used by every path; the existing `POST /api/links` gains a validated `source`. The app becomes an installable PWA whose manifest declares a GET share target pointing at `/share`. The extension (`extension/`, plain MV3, no build step) calls the API with the browser's existing session cookie. The iPhone Shortcut opens `/share` in Safari. Settings gains per-device setup steps.

**Tech Stack:** Next.js 16 metadata routes (`manifest.ts`), Chrome Manifest V3, Apple Shortcuts.

**Spec:** `SPEC.md` (MVP 1: Capture). Owner decisions 2026-11-15: no access keys; brief Safari hop on iPhone is fine; stay $0 (no domain, no Web Store; extension built store-ready, loaded unpacked); Android is the owner's phone, iPhone via a friend.

## Global Constraints
- $0; app URL stays `https://read-later-alpha.vercel.app`.
- No API keys: every path authenticates with the user's session cookie.
- `source` values written: `share` (Android, iPhone), `extension` (Chrome); anything else is rejected.
- Extension: minimum permissions (`activeTab`, `contextMenus`, host access to the app URL only), no remote code, Hum look.
- Login's return path (`next`) only accepts this site's own relative paths.

## Review Focus
1. Shared text like "Look at this https://x.com/a/status/1 🔥" saves the link inside it.
2. A logged-out share comes back to the save page after login, not to the list.
3. `next=//evil.com` or `next=https://evil.com` cannot redirect off-site.
4. Sharing the same link twice says "Already saved this week", never duplicates.
5. The extension on a `chrome://` or file page explains it can't save that page.

---

### Task 1: Save page and API — `src/app/share/`, `src/links/display.ts`, `src/app/api/links/route.ts`, login `next`
- [ ] `extractSharedUrl({ url, text, title })` (TDD); `safeNextPath(value)` (TDD).
- [ ] `/share` saves via `POST /api/links` with `source: "share"` from a client component after load; shows title, "Saved ✓" / "Already saved" / error, and links back to the list.
- [ ] Proxy and login keep `/share?…` as the post-login destination.

### Task 2: Installable app — `src/app/manifest.ts`, icons
- [ ] Manifest with Hum colours, 192/512 and maskable icons, `share_target` GET `/share` with `title`, `text`, `url`. Service worker only if Chrome still needs one to offer install.

### Task 3: Chrome extension (subagent) — `extension/`
- [ ] Popup saves the current tab (title, "Saved ✓", "Already saved", "Log in", "Can't save this page"); right-click "Save to Read Later" on links and pages with a badge result; ⌘⇧S / Ctrl+Shift+S opens the popup; README with load-unpacked steps.

### Task 4: Settings → Save from anywhere
- [ ] Android install, Chrome extension and iPhone Shortcut steps.

### Task 5: Verify
- [ ] Tests, typecheck, lint, build; `/share` flows in the browser (logged in, logged out, text with link, duplicate); manifest served; commit locally.
