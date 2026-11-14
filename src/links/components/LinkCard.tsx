"use client";

import { ArrowUpRight, Check, Clock, Play, Trash2 } from "lucide-react";
import type { MouseEvent } from "react";
import { displayTitle, savedDay, youTubeId } from "../display";
import type { Link } from "../types";
import { CardImage } from "./CardImage";
import { Favicon } from "./Favicon";
import { TYPE_META } from "./type-meta";

export type CardProps = {
  link: Link;
  now: number;
  timeZone: string;
  loading: boolean;
  nudge: boolean;
  error?: string;
  onOpen: (event: MouseEvent<HTMLAnchorElement>) => void;
  onDone?: () => void;
  onDelete: () => void;
  onDismissNudge: () => void;
};

const iconButton =
  "hit grid size-9 place-items-center rounded-control text-muted transition-colors duration-(--dur-micro) hover:bg-paper-2 hover:text-ink";

export function DoneButton({ onClick, title, compact = false }: { onClick: () => void; title: string; compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`stock flex h-9 items-center gap-1.5 rounded-control bg-mint font-display text-sm font-semibold text-mint-ink [--stock-edge:var(--color-mint-deep)] ${
        compact ? "w-9 justify-center" : "pr-3.5 pl-2.5"
      }`}
    >
      <Check aria-hidden className="size-4" strokeWidth={2.6} />
      <span className={compact ? "visually-hidden" : undefined}>Done</span>
      <span className="visually-hidden">: {title}</span>
    </button>
  );
}

/** One saved link as a card: picture first, then where it is from, the title and its actions. */
export function LinkCard({ link, now, timeZone, loading, nudge, error, onOpen, onDone, onDelete, onDismissNudge }: CardProps) {
  const meta = TYPE_META[link.type];
  const title = displayTitle(link);
  const site = link.site ?? new URL(link.url).hostname.replace(/^www\./, "");
  const isQuote = link.type === "thread" && !link.thumbnail_url && !loading && link.title !== null;
  // YouTube videos play inside the app, so they get a play mark instead of the leave-the-site arrow.
  const VerbIcon = youTubeId(link.url) ? Play : ArrowUpRight;

  return (
    <article
      aria-busy={loading || undefined}
      className={`group relative flex flex-col overflow-hidden rounded-card bg-card shadow-(--shadow-card) transition-[translate,box-shadow] duration-(--dur-short) ease-(--ease-snap) animate-rise hover:-translate-y-0.5 hover:shadow-(--shadow-lift) ${
        nudge ? "outline-2 outline-offset-2 outline-accent-deep" : ""
      }`}
    >
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onOpen}
        tabIndex={-1}
        aria-hidden
        className={`relative block overflow-hidden ${isQuote ? "flex min-h-52 flex-1 items-end bg-quote px-5 pt-12 pb-5 no-underline" : "aspect-video"}`}
      >
        {loading ? (
          <div className="shimmer size-full" />
        ) : isQuote ? (
          <p className="line-clamp-5 text-lg leading-snug font-semibold tracking-[-0.015em] text-ink">{title}</p>
        ) : (
          <CardImage src={link.thumbnail_url} type={link.type} className="size-full transition-transform duration-(--dur-long) group-hover:scale-[1.04]" />
        )}
        <span className={`absolute top-3 left-3 flex items-center gap-1.5 rounded-pill py-1 pr-2.5 pl-2 text-xs font-semibold text-ink ${meta.tint}`}>
          <meta.Icon aria-hidden className="size-3.5" />
          {meta.label}
        </span>
        {link.est_minutes ? (
          <span className="absolute right-3 bottom-3 flex items-center gap-1 rounded-pill bg-overlay/80 px-2.5 py-1 text-xs font-semibold text-overlay-ink backdrop-blur">
            <Clock aria-hidden className="size-3.5" />
            <span className="num">{link.est_minutes}</span> min
          </span>
        ) : null}
      </a>

      <div className="flex flex-col gap-2 px-4 pt-3.5 pb-4">
        <div className="flex min-w-0 items-center gap-2 text-sm text-muted">
          <Favicon url={link.url} site={site} />
          <span className="truncate text-ink-2">{site}</span>
          <span className="ml-auto shrink-0">{savedDay(link.saved_at, now, timeZone)}</span>
        </div>

        {!isQuote && (
          <h3 className="m-0 max-w-none text-lg leading-snug tracking-[-0.02em]">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onOpen}
              className={`line-clamp-3 no-underline after:absolute after:inset-0 after:content-[''] hover:underline hover:decoration-link hover:decoration-2 hover:underline-offset-4 ${
                loading ? "text-muted" : "text-ink"
              }`}
            >
              {loading ? `${title}, fetching details…` : title}
            </a>
          </h3>
        )}
        {isQuote && (
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onOpen}
            className="visually-hidden after:absolute after:inset-0 after:content-['']"
          >
            {title}
          </a>
        )}

        {error && (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        )}

        {nudge && onDone ? (
          <div role="status" className="pointer-events-none relative z-(--z-raised) mt-1 flex items-center justify-between gap-2 rounded-control bg-accent/35 py-1.5 pr-1.5 pl-3 text-sm text-ink">
            <span className="font-semibold">Finished it?</span>
            <span className="pointer-events-auto flex items-center gap-1">
              <button type="button" onClick={onDismissNudge} className="hit h-9 rounded-control px-2.5 text-sm font-medium text-ink-2 hover:bg-paper-2">
                Not yet
              </button>
              <DoneButton onClick={onDone} title={title} />
            </span>
          </div>
        ) : (
          <div className="pointer-events-none relative z-(--z-raised) mt-1 flex items-center justify-between">
            <span className="flex items-center gap-1 text-sm font-semibold text-link">
              {meta.verb}
              <VerbIcon aria-hidden className="size-4" />
            </span>
            <span className="pointer-events-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={onDelete}
                className={`${iconButton} opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100`}
              >
                <Trash2 aria-hidden className="size-4" />
                <span className="visually-hidden">Delete: {title}</span>
              </button>
              {onDone && <DoneButton onClick={onDone} title={title} />}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}
