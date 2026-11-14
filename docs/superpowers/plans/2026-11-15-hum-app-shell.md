# Hum theme, app shell and card grid — Implementation Plan

> **For agentic workers:** native execution (owner chose the cheaper path). Steps use `- [ ]`.

**Goal:** Re-theme the app to Hum (light + dark, system default), add a sidebar shell, a card grid with an optional compact list, an in-app YouTube player, and the delight features the owner approved.

**Architecture:** Same data layer as Phase 1 (no schema change). New UI lives in `src/shell/` (sidebar, mobile tab bar, theme switch, shortcuts) and `src/links/components/` (cards, list rows, filters, player). Pure helpers (YouTube id, type filter parsing, relative day) live in `src/links/display.ts` with tests. Tokens move to Hum in `src/app/tokens.css`; `DESIGN.md` is re-locked to Hum.

**Tech Stack:** Next.js 16 (cacheComponents), Tailwind 4 tokens, Chillax self-hosted via `next/font/local`, `lucide-react` icons, native `<dialog>` for the player and shortcut help.

**Spec:** `SPEC.md` (MVP 2: reading list, each item Open/Done/Delete, filters) plus the owner's 2026-11-15 feedback.

## Global Constraints
- $0: no paid services; YouTube embeds via `youtube-nocookie.com`; favicons read from each site's own `/favicon.ico`, never a third-party favicon service.
- Hum: Chillax 500/600 throughout, round surfaces (24px cards, 12–16px controls, pills), pear for the primary action, blue for links and focus, mint for done, coral sparingly; never emoji, never square corners.
- Light + dark from one token set; system default; toggle Auto / Light / Dark persisted in `localStorage`.
- Every motion has a `prefers-reduced-motion` end state; transform/opacity only.
- Floor: tokens for every colour and font, `:focus-visible` everywhere, 44px touch targets, contrast 4.5:1 text / 3:1 UI in both modes.

## Review Focus
1. Paste-anywhere must not fire while typing in a field or when the clipboard holds non-URL text.
2. Shortcuts must not fire inside inputs or with modifier keys.
3. YouTube links without a parseable id (channels, playlists) open externally, never a broken player.
4. Undo row and the card collapse must keep focus on Undo for keyboard users.
5. Filters live in the URL (`?type=video`) and combine with the view (`?view=done&type=video`).

---

### Task 1: Hum foundation
- [ ] `tokens.css`: Hum light tokens + dark block (blue-black paper, cream ink, softened accents), `--grain`; Chillax via `next/font/local`; `globals.css` stamp updated; `DESIGN.md` re-locked to Hum.

### Task 2: Helpers (TDD) — `src/links/display.ts`
- [ ] `youTubeId(url): string | null` (watch?v=, youtu.be, shorts, embed); `parseType(value): "all" | LinkType`; `savedDay(savedAt, now, timeZone): "Today" | "Yesterday" | "<d Month>"`; `faviconUrl(url): string`.

### Task 3: Shell
- [ ] `src/shell/Sidebar.tsx` (≥60rem): wordmark, "Save a link" (focuses the field), nav with Lucide icons and counts, theme switch, sign out. `src/shell/MobileBar.tsx` (<60rem): top bar + bottom tab bar with counts. `queries.ts`: `countLinks(db, userId, windowStart)` → `{ week, older, done }`.

### Task 4: List screen
- [ ] Save row with "⌘V anywhere" hint; dated head + summary; type filters (URL); Cards/List switch (localStorage); `LinkCard.tsx` (badge + duration on image, favicon + site + day, 3-line title, verb link, Done pill, quiet delete, quote variant for imageless posts); `LinkRow.tsx` restyled as the compact list; undo row; skeleton; empty states with Lucide icons.

### Task 5: Interactions
- [ ] Done: tick pop then collapse to Undo; save: new card enters with a shimmer, image fades in; hover lift/zoom; paste anywhere; shortcuts (`/`, `1` `2` `3`, `?` dialog); "Finished it?" on return after opening a link; tab title count.

### Task 6: YouTube player
- [ ] `VideoPlayer.tsx`: `<dialog>` with a 16:9 `youtube-nocookie` iframe (autoplay), title, "Mark done" and "Open on YouTube"; cards and rows open it for parseable videos.

### Task 7: Login
- [ ] Split screen: form left; right, a looping demo of three clearly sample cards (save, image fade-in, done tick); static under reduced motion; hidden under 60rem.

### Task 8: Verify
- [ ] Tests, typecheck, lint, build; screenshots light/dark × desktop/phone × states; sloplint Floor 0; commit.
