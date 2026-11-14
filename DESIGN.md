# Design: Read Later

The locked system. Every Hallmark run reads this first and pages share it. Change it on purpose; the file is the rule.

## System
- Genre: playful
- Shape of the first page: app screen (a sidebar beside the week's card grid; a bottom tab bar on phones)
- Theme: Hum (by request), app-tuned: no torn edges or cut-paper scenery; the playfulness is the rounded type, card-stock controls, tinted type badges and small state motion
- Axes: light/rounded-sans/chromatic-yellow · posture: full-palette
- Modes: light and dark, following the system by default; the theme switch (Light / Dark / Match system) stores the choice in `localStorage` (`mode`)

## Tokens
`src/app/tokens.css` is the source of truth (Tailwind 4 `@theme static`, so every token is also a utility: `bg-card`, `text-ink`, `bg-accent`, `text-link`, `bg-mint`, `bg-tint-video`, `rounded-card`). The roles, light values:
```css
:root {
  --color-paper: oklch(97% 0.012 95);  --color-paper-2: oklch(94.5% 0.018 95);  --color-paper-3: oklch(91% 0.022 95);  --color-card: oklch(98.8% 0.007 95);
  --color-ink: oklch(20% 0.014 255);  --color-ink-2: oklch(29% 0.014 255);  --color-muted: oklch(47% 0.014 255);  --color-rule: oklch(87% 0.016 95);
  --color-accent: oklch(87% 0.175 96) /* pear: primary action */;  --color-accent-deep: oklch(72% 0.16 92) /* its card-stock edge */;
  --color-link: oklch(50% 0.17 250) /* blue: links, verbs, focus */;  --color-mint: oklch(82% 0.15 152) /* done */;  --color-coral: oklch(70% 0.2 22);
  --color-tint-article / -video / -post: soft mint / coral / sugar-blue badge and placeholder tints;
  --font-display / --font-body: Chillax 500/600 (self-hosted, src/app/fonts);
  --radius-card: 24px;  --radius-stock: 16px;  --radius-control: 12px;  --radius-input: 14px;  --radius-pill: 999px;
}
```
Dark values live in the same file: Hum's blue-black ink becomes the night paper (`oklch(19% 0.016 255)`), cream the ink, accents soften and tints deepen; hues never move; shadows become inset hairlines. Every text pair holds 4.5:1 or better in both modes (lowest 5.4:1). The app container is `--container-app` (76rem), the sidebar `--sidebar` (15rem); a fine `--grain` sits under the paper.

## Rules
- Surfaces: paper with grain; round cards on `--shadow-card`, lifting to `--shadow-lift` on hover; no card inside a card, no square corner, no glass.
- Type: Chillax everywhere, 600 for heads and titles, 500 for text and labels; sentence case; figures `tabular-nums` (`num` utility). No serif, no tracked capitals.
- Colour jobs: pear only on the primary action and the current phone tab; blue for links, verbs and the focus ring; mint for done; type tints only on badges and empty image plates; coral sparingly.
- Icons from `lucide-react`, never emoji. Words beside icons wherever space allows.
- Cards: picture first with the type badge top-left and the length bottom-right; favicon, site and saved day; up to 3-line title; verb link (Read / Watch / View post), a mint Done pill and a quiet delete that shows on hover and keyboard focus (always on touch). Imageless posts show their text as a quote panel.
- Every data region draws loading (shimmer), empty (icon, line, one action), error and full states; reversible actions apply at once with an in-place Undo tile, never a confirm or a toast.

## Controls
- Primary: `bg-accent` card stock, `text-accent-ink`, `rounded-stock`, 44–48px, Chillax 600, `stock` utility with `--stock-edge: var(--color-accent-deep)` (edge rises on hover, presses flat on click).
- Done: `bg-mint` card stock with `--color-mint-deep` edge. Secondary: `bg-paper-2`/`paper-3` stock. Icon buttons 36px with a 44px hit area (`hit`).
- Fields: 48px, `rounded-input`, 1px `muted` edge, card fill, inset 2px blue focus ring, label (visible or visually hidden), status line below reserving one line.
- Segmented switches (theme, layout): pill track in `paper`/`paper-2`, selected segment `bg-card` with the card shadow.

## Motion
- Character: brisk and springy only where it rewards: the card-stock press, the Done tick pop (`animate-pop`), new cards rising in (`animate-rise`), images fading in, hover lift. Everything else is a colour step at `--dur-micro`. Under reduced motion every animation ends at once and the login demo stays still.

## Exports
`src/app/tokens.css` in this project, already in Tailwind 4 form. DTCG or shadcn blocks are added here on request, per `export-formats.md`.
