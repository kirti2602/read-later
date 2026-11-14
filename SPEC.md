# Read Later Reminder App — Product Spec

Nov 10, 2026 · @Kirti

## Problem and goals

One place to dump links from any device, and one nudge every weekend to read what that week produced. Today links scatter across X bookmarks, browser bookmarks and a WhatsApp chat with yourself, and nothing ever brings them back.

**Goals for v1**

- Saving a link takes under 3 seconds and at most 2 taps, from phone or laptop.
- Every Saturday morning, one reminder lists only the unread links saved that week (Sat 09:00 to the next Sat 09:00).
- Each link in the reminder can be opened or marked done in one tap.
- Runs at $0 a month on free tiers.

**Non-goals for v1**

- Not a social or public bookmarking product.
- No full-text archiving, highlighting or note-taking.
- No AI summaries (a strong v2 candidate, see Later phases).

## Users and use cases

The only user is you for now: no sign-up, no billing, one account behind a single login.

| Situation | What you do | What the app does |
| --- | --- | --- |
| Scrolling X on your phone | Tap Share → app | Saves the link, fetches title and thumbnail, replies "Saved ✓" |
| Reading a blog on your laptop | Click the browser extension, or paste into the web app | Saves the link with its title and site name |
| Watching YouTube | Share → app | Saves it, tags it as a video, stores duration |
| Saturday morning | Open the email digest | Shows this week's unread links, each with Open and Done |
| Sunday evening, items left | Nothing | Sends one short follow-up only if you opted in |

## MVP features

Three capture paths, one list, one weekly digest. Everything runs at $0, so the digest goes by email and WhatsApp is out of v1.

**1. Capture**

- **WhatsApp:** not in v1, since Meta bills bot messages. The share sheet below replaces sending links to yourself.
- **Phone share sheet:** an installable web app (PWA) registers as a share target on Android; iOS uses an Apple Shortcut that posts to the API.
- **Laptop:** a one-click browser extension for Chrome, plus paste-a-link on the web app.
- On save, the backend fetches title, site, thumbnail and type (article, video, thread) from the page's preview tags.
- Duplicate links within the same week are merged, not saved twice.

**2. Reading list (web app)**

- Default view: this week's unread items, newest first.
- Each item: title, source, type icon, estimated read time or video length, Open, Done, Delete.
- Filters: This week, Older unread, Done.

**3. Weekly digest**

- Sent Saturday 09:00 your local time by email.
- Lists this week's unread items, then last week's leftovers under "From last week", numbered, with total read time ("6 links, \~42 min").
- Tap Done beside a link in the email to mark it read.
- No digest if there are no new or rolled-over items.

## Reminder rules

The digest covers the 7 days since the previous digest (Sat 09:00 to Sat 09:00), so a link saved Saturday afternoon or Sunday lands in next week's digest instead of being missed.

1. A scheduled job runs every hour and finds users whose local time is Saturday 09:00.
2. It selects items where `saved_at` falls in the window, plus unread items from the previous window with digest\_count = 1, and `status = unread`.
3. Zero items → send nothing. One or more → send the digest and log it.
4. Optional Sunday 18:00 follow-up: only if at least one item is still unread, and only if you turn it on.
5. Unread items roll over once: they reappear in the next digest under a "From last week" heading, after the new links. After that they live only in "Older unread" on the web app.

**Channel: email.** WhatsApp has no reliable free path: a bot can only start a chat with a paid template, and from 1 October 2026 Meta bills utility templates even inside the 24-hour reply window ([respond.io](https://respond.io/help/whatsapp/whatsapp-pricing)). So v1 sends the digest by email, which carries the full list and costs nothing at this volume.

Unofficial WhatsApp libraries that drive a personal account would be free but break Meta's terms and risk the number being banned, so they stay out. If you later want a chat channel at $0, a Telegram bot is free and has no template rules.

## Architecture and stack

One small web app with an API, a database and one scheduled job; every piece runs on a free tier for a single user.

&#91;embedded content: system architecture · 3 capture paths, 1 API, 1 scheduled job\]

Done links in the email call the API directly, so marking an item read needs no login.

| Layer | Suggested choice | Why |
| --- | --- | --- |
| Web app + API | Next.js (TypeScript) on Vercel | One codebase for UI, API routes and the installable PWA |
| Database | Supabase Postgres | Free tier; built-in auth if it ever goes multi-user |
| Scheduler | Vercel Cron or Supabase pg\_cron, hourly | No server to babysit |
| WhatsApp | Not in v1 | No free path: Meta bills bot-sent templates |
| Email | Resend or Postmark | Simple API, good deliverability |
| Link previews | Open Graph tags, plus oEmbed for YouTube and X | Titles and thumbnails without scraping hacks |
| Laptop capture | Chrome extension (Manifest V3) with a personal API token | One click, no login per save |
| iPhone capture | Apple Shortcut in the share sheet | iOS Safari doesn't support PWA share targets |

## Data model

Three tables cover v1.

| Table | Key fields | Notes |
| --- | --- | --- |
| `users` | id, email, timezone, digest\_day, digest\_time, followup\_enabled | One row for now; multi-user ready |
| `links` | id, user\_id, url, canonical\_url, title, site, thumbnail\_url, type (article / video / thread / other), est\_minutes, note, source (whatsapp / extension / share / web), status (unread / done / deleted), saved\_at, done\_at, digest\_count (times shown in a digest, max 2) | Unique on (user\_id, canonical\_url, digest window) |
| `digests` | id, user\_id, window\_start, window\_end, channel, link\_ids, sent\_at, delivery\_status | Audit trail; also defines the next window's start |

## Later phases

These target the real problem, that reading is hard, rather than adding more saving options.

| Feature | Why it helps you | Effort |
| --- | --- | --- |
| Listen mode (text-to-speech for articles) | Turns reading into listening on a walk or commute | Medium |
| 3-line AI summary per link | Lets you decide in seconds whether a link is worth the full read | Low |
| Digest sorted by time ("5 min reads first") | Quick wins first builds momentum | Low |
| Weekly cap ("max 5 links in digest") | A list of 20 is discouraging; 5 gets done | Low |
| Streak and weekly stats | Light motivation without guilt | Low |
| Tags or auto-categories (dev, design, finance) | Find old links by topic | Medium |
| Import existing X bookmarks and the WhatsApp self-chat | Rescues links you've already lost | Medium |
| Full-text search across saved pages | Find "that article about X" months later | High |

## Build plan

About three weeks of evenings for one developer, shipping something usable after week 1. The digest is email only, because WhatsApp can't run for free.

A working email digest by week 2, all on free tiers.

| Phase | When | Scope |
| --- | --- | --- |
| 1. Save and list | Week 1 | Database and API · Web app: paste a link · Titles and thumbnails · Mark done, delete |
| 2. Email digest | Week 2 | Hourly digest job · Weekly window and rollover · Email with Done links |
| 3. Capture anywhere | Week 3 | Android share target · iOS Shortcut · Chrome extension |

Later, optional: Telegram bot, AI summaries, listen mode.

Week durations are estimates for a solo builder and will shift once the stack is decided. If you later want chat capture and a chat digest at $0, a Telegram bot is the next phase.

## Building it with AI

An AI coding tool such as Claude Code writes the code; your job is to give it this spec, keep it to one phase at a time, and test what it builds.

1. **Set up free accounts:** GitHub, Vercel, Supabase and Resend, plus the AI coding tool on your laptop.
2. **Hand it the spec:** export this doc as Markdown into the project folder as `SPEC.md`. Add a short `CLAUDE.md` with the rules: use the stack in the spec, everything must stay on free tiers, single user, build one phase at a time.
3. **Plan before code:** each session, ask it to read the spec and propose a plan for one phase. Read the plan, cut anything not in the spec, then let it build.
4. **Test as the user:** after each step, run the app and try it yourself. Paste any error message straight back to the AI.
5. **Commit when it works:** ask it to commit after every working step, so a bad change can be rolled back.
6. **Deploy:** push to GitHub and connect the repo to Vercel. Keep API keys in environment variables, never in prompts or code.
7. **Test the digest without waiting:** ask for a private "send digest now" button so you can check the email any day.
8. **Live with it:** use it for two weekends, note what annoys you, and turn each note into the next prompt.

A first prompt can be as simple as:

```
Read SPEC.md. Build Phase 1 (Save and list) only, using the stack in the spec.
Start by proposing a plan and the folder structure, and wait for my OK before writing code.
```

## Open questions

- [ ] Decided: just for you to start, kept simple and free.
- [ ] Decided: built with an AI coding tool on the suggested stack (see Building it with AI).
- [ ] Decided: both phones, so v1 ships the Android share target and the iOS Shortcut.
- [ ] Decided: email only, since WhatsApp can't be sent for free.
- [ ] Decided: the week runs from one Saturday digest to the next.
- [ ] Decided: unread links roll over into one more digest under "From last week".
- [ ] Decided: digest goes out Saturday 09:00 local time.
