"use client";

import { Clock, Trash2 } from "lucide-react";
import { displayTitle, savedDay, sourceLine } from "../display";
import { CardImage } from "./CardImage";
import { DoneButton, type CardProps } from "./LinkCard";

/** The compact list layout: the same link and actions as a card, in one row for skimming. */
export function LinkRow({ link, now, timeZone, loading, nudge, error, onOpen, onDone, onDelete, onDismissNudge }: CardProps) {
  const title = displayTitle(link);

  return (
    <li
      aria-busy={loading || undefined}
      className={`group relative flex items-center gap-3 rounded-stock bg-card p-2.5 pr-3 shadow-(--shadow-card) transition-[translate,box-shadow] duration-(--dur-short) ease-(--ease-snap) animate-rise hover:shadow-(--shadow-lift) sm:gap-4 ${
        nudge ? "outline-2 outline-offset-2 outline-accent-deep" : ""
      }`}
    >
      <div className="h-12 w-16 shrink-0 overflow-hidden rounded-control sm:h-16 sm:w-28">
        {loading ? <div className="shimmer size-full" /> : <CardImage src={link.thumbnail_url} type={link.type} className="size-full" />}
      </div>

      <div className="min-w-0 flex-1">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onOpen}
          className={`line-clamp-2 text-md leading-snug font-semibold no-underline after:absolute after:inset-0 after:content-[''] hover:underline hover:decoration-link hover:decoration-2 hover:underline-offset-4 ${
            loading ? "text-muted" : "text-ink"
          }`}
        >
          {title}
        </a>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-muted">
          <span>{loading ? "Fetching details…" : sourceLine(link)}</span>
          {link.est_minutes ? (
            <span className="flex items-center gap-1">
              <Clock aria-hidden className="size-3.5" />
              <span className="num">{link.est_minutes}</span> min
            </span>
          ) : null}
          <span className="hidden sm:inline">{savedDay(link.saved_at, now, timeZone)}</span>
        </p>
        {error && (
          <p role="alert" className="mt-0.5 text-sm text-error">
            {error}
          </p>
        )}
      </div>

      <div className="pointer-events-none relative z-(--z-raised) flex shrink-0 items-center gap-1">
        {nudge && onDone ? (
          <span className="pointer-events-auto flex items-center gap-1">
            <span className="hidden text-sm font-semibold text-ink sm:inline">Finished it?</span>
            <button type="button" onClick={onDismissNudge} className="hit h-9 rounded-control px-2 text-sm font-medium text-ink-2 hover:bg-paper-2">
              Not yet
            </button>
            <DoneButton onClick={onDone} title={title} compact />
          </span>
        ) : (
          <span className="pointer-events-auto flex items-center gap-1">
            <button
              type="button"
              onClick={onDelete}
              className="hit grid size-9 place-items-center rounded-control text-muted transition-colors duration-(--dur-micro) hover:bg-paper-2 hover:text-ink [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100"
            >
              <Trash2 aria-hidden className="size-4" />
              <span className="visually-hidden">Delete: {title}</span>
            </button>
            {onDone && <DoneButton onClick={onDone} title={title} compact />}
          </span>
        )}
      </div>
    </li>
  );
}
