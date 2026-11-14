# Design: Read Later

The locked system. Every Hallmark run reads this first and pages share it. Change it on purpose; the file is the rule.

## System
- Genre: editorial
- Shape of the first page: app screen (the week's sheet: a dated head over numbered ruled rows)
- Theme: Almanac
- Axes: mid/grotesk-sans/chromatic-magenta · posture: restrained
- Modes: light and dark, following the system by default; the header toggle cycles Auto, Light, Dark and stores the choice in `localStorage` (`mode`)

## Tokens
`src/app/tokens.css` is the source of truth (Tailwind 4 `@theme static`, so every token is also a utility: `bg-sheet`, `text-ink`, `border-rule`, `font-display`, `rounded-pill`). The roles, light values:
```css
:root {
  --color-paper: oklch(84% 0.012 245);  --color-paper-2: oklch(81% 0.012 245);  --color-paper-3: oklch(77% 0.012 245);
  --color-sheet: oklch(93.5% 0.008 245);
  --color-ink: oklch(16% 0.020 245);  --color-ink-2: oklch(24% 0.018 245);  --color-muted: oklch(38% 0.016 245);
  --color-rule: oklch(73% 0.013 240);  --color-rule-2: oklch(32% 0.018 240);
  --color-accent: oklch(45% 0.180 350);  --color-accent-2: oklch(37% 0.160 350);  --color-accent-ink: oklch(97% 0.006 245);  --color-focus: oklch(46% 0.190 350);
  --font-display: Hanken Grotesk 500/600;  --font-body: Newsreader (optical sizes);  --font-outlier: IBM Plex Mono 400/500, numerals only;
  --radius-card: 0;  --radius-pill: 2px;  --rule-hair: 1px;  --rule-bar: 2px;  --shadow-card: none;
}
```
Dark values live in the same file under `[data-mode="dark"]` and `prefers-color-scheme: dark`; surfaces step lighter for elevation, the accent softens to `oklch(55% 0.160 350)` with a darker hover `oklch(49% 0.150 350)` so white text holds 6.4:1, hues never move. The spacing scale, type scale, easings and durations are the scaffold's and live in `tokens.css`; the app container is `--container-app` (56rem).

## Rules
- Surfaces: slate paper; the save row and tabs sit on the paper, and one pale `sheet` per screen opens with a 2px ink rule straight onto its dated head (the current tab's magenta bar overlays that rule). Hairline `rule` between rows, a 2px `rule-2` under the sheet head. No cards, no shadows.
- Type: heads in Hanken Grotesk 600, sentence case; titles and prose in Newsreader; labels in Newsreader 500 a step smaller, never capitals; figures (counts, minutes, row numbers) in Plex Mono with `tabular-nums`.
- Magenta only on the primary action, the current tab, focus rings and the 1px underline on link titles (2px on hover); under 5% of a screen.
- Words, never emoji or decorative icons: "Video on YouTube", a type word in an empty thumbnail.
- Every data region draws loading, empty, error and full states; reversible actions apply at once with an in-place Undo, never a confirm or a toast.

## Controls
- Primary: `bg-accent` fill, `text-accent-ink`, 2px radius, 40px tall (32px in rows), Hanken Grotesk 500.
- Secondary: 1px ink outline at the same radius and height; tertiary is text in `muted`, ink on hover. Compact controls keep a 44px hit target (`hit` utility).
- Fields: 1px `muted` edge, sheet fill, inset 2px focus ring in `focus`, visible label above, status line below reserving one line.

## Motion
- Character: still. Only state moves (colour steps at `--dur-micro`, a 1px press); the loading plate pulses only under `motion-safe`. No reveals.

## Exports
`src/app/tokens.css` in this project, already in Tailwind 4 form. DTCG or shadcn blocks are added here on request, per `export-formats.md`.
