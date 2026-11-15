import { ChevronDown, Laptop, Smartphone, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

const EXTENSION_FOLDER = "https://github.com/kirti2602/read-later/tree/main/extension";

function Guide({ Icon, tint, title, summary, children }: { Icon: LucideIcon; tint: string; title: string; summary: string; children: ReactNode }) {
  return (
    <details className="group rounded-stock bg-paper p-4 shadow-[inset_0_0_0_1px_var(--color-rule)] open:bg-card">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-control outline-offset-4 [&::-webkit-details-marker]:hidden">
        <span className={`grid size-10 shrink-0 place-items-center rounded-pill ${tint} text-ink`}>
          <Icon aria-hidden className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-md font-semibold text-ink">{title}</span>
          <span className="block text-sm text-muted">{summary}</span>
        </span>
        <ChevronDown aria-hidden className="size-5 shrink-0 text-muted transition-transform duration-(--dur-short) group-open:rotate-180" />
      </summary>
      <ol className="mt-4 ml-1 list-decimal space-y-2 pl-5 text-md text-ink-2 marker:font-semibold marker:text-muted">{children}</ol>
    </details>
  );
}

const Code = ({ children }: { children: ReactNode }) => (
  <code className="rounded-[6px] bg-paper-2 px-1.5 py-0.5 text-sm break-all text-ink">{children}</code>
);

/** Per-device setup for saving without opening the app. Every path uses the person's normal login. */
export function CaptureGuide({ appUrl }: { appUrl: string }) {
  return (
    <section aria-labelledby="capture-heading" className="mt-6 max-w-2xl rounded-card bg-card p-6 shadow-(--shadow-card) sm:p-8">
      <h2 id="capture-heading" className="max-w-none text-xl">
        Save from anywhere
      </h2>
      <p className="mt-1 text-md text-muted">
        Set up each device once. You stay signed in, so saving is a share or a click; no keys to copy.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <Guide Icon={Smartphone} tint="bg-tint-article" title="Android" summary="Share → Read Later from any app">
          <li>
            On your phone, open <Code>{appUrl}</Code> in Chrome and sign in.
          </li>
          <li>
            Tap the <strong>⋮</strong> menu, then <strong>Install app</strong> (or <strong>Add to Home screen → Install</strong>).
          </li>
          <li>
            In X, YouTube, Chrome or any app, tap <strong>Share</strong> and pick <strong>Read Later</strong>. You&apos;ll see &ldquo;Saved ✓&rdquo;; press back to return.
          </li>
        </Guide>

        <Guide Icon={Laptop} tint="bg-tint-post" title="Laptop: Chrome, Edge or Brave" summary="One click, ⌘⇧S, or right-click a link">
          <li>
            Get the <Code>extension</Code> folder from the project (
            <a href={EXTENSION_FOLDER} target="_blank" rel="noopener noreferrer" className="font-semibold text-link">
              on GitHub
            </a>
            ).
          </li>
          <li>
            Open <Code>chrome://extensions</Code>, turn on <strong>Developer mode</strong>, click <strong>Load unpacked</strong> and choose that folder.
          </li>
          <li>Pin Read Later to the toolbar. Sign in to Read Later in the same browser.</li>
          <li>
            Click the icon (or press <strong>⌘⇧S</strong> / <strong>Ctrl+Shift+S</strong>) to save the page; right-click any link for <strong>Save link to Read Later</strong>.
          </li>
        </Guide>

        <Guide Icon={Smartphone} tint="bg-tint-video" title="iPhone" summary="A Shortcut in the share sheet">
          <li>
            Sign in to <Code>{appUrl}</Code> in Safari once.
          </li>
          <li>
            Open <strong>Shortcuts</strong>, tap <strong>+</strong> and name it <strong>Read Later</strong>.
          </li>
          <li>
            Turn on <strong>Show in Share Sheet</strong> (in the shortcut&apos;s details) and let it receive <strong>URLs, Safari web pages and Text</strong>.
          </li>
          <li>
            Add <strong>Get URLs from Input</strong>, then <strong>URL Encode</strong>, then <strong>Text</strong> containing <Code>{`${appUrl}/share?url=`}</Code> followed by the encoded URL, then <strong>Open URLs</strong>.
          </li>
          <li>
            Share any page and pick <strong>Read Later</strong>: Safari opens for a moment, saves it and shows &ldquo;Saved ✓&rdquo;.
          </li>
        </Guide>
      </div>
    </section>
  );
}
