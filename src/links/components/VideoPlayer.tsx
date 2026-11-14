"use client";

import { ArrowUpRight, Check, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { displayTitle, youTubeId } from "../display";
import type { Link } from "../types";

/**
 * Plays a YouTube link inside the app. The privacy-enhanced embed host sets no tracking
 * cookies until play; closing the dialog unmounts the iframe, which stops playback.
 */
export function VideoPlayer({ link, onClose, onDone }: { link: Link | null; onClose: () => void; onDone?: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const id = link ? youTubeId(link.url) : null;

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (id && !el.open) {
      el.showModal();
      // showModal focuses the first focusable child, the video, which swallows Escape; start on Close instead.
      closeButton.current?.focus();
    }
    if (!id && el.open) el.close();
  }, [id]);

  return (
    <dialog
      ref={dialog}
      aria-label={link ? `Watch: ${displayTitle(link)}` : "Video player"}
      onClose={onClose}
      onClick={(event) => event.target === dialog.current && dialog.current?.close()}
      className="m-auto w-[min(64rem,calc(100vw-2rem))] overflow-hidden rounded-card bg-card p-0 text-ink-2 shadow-(--shadow-lift) backdrop:bg-overlay/70 backdrop:backdrop-blur-sm"
    >
      {link && id && (
        <>
          <div className="aspect-video bg-overlay">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
              title={displayTitle(link)}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="size-full border-0"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 px-5 py-4">
            <h2 className="m-0 min-w-0 flex-1 text-md leading-snug sm:text-lg">{displayTitle(link)}</h2>
            <div className="flex items-center gap-2">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hit flex h-10 items-center gap-1 rounded-control px-3 text-sm font-semibold text-link no-underline hover:bg-paper-2"
              >
                Open on YouTube
                <ArrowUpRight aria-hidden className="size-4" />
              </a>
              {onDone && (
                <button
                  type="button"
                  onClick={() => {
                    onDone();
                    dialog.current?.close();
                  }}
                  className="stock flex h-10 items-center gap-1.5 rounded-control bg-mint pr-4 pl-3 font-display text-sm font-semibold text-mint-ink [--stock-edge:var(--color-mint-deep)]"
                >
                  <Check aria-hidden className="size-4" strokeWidth={2.6} />
                  Mark done
                </button>
              )}
              <button
                ref={closeButton}
                type="button"
                aria-label="Close player"
                onClick={() => dialog.current?.close()}
                className="hit grid size-10 place-items-center rounded-control text-muted hover:bg-paper-2 hover:text-ink"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>
          </div>
        </>
      )}
    </dialog>
  );
}
