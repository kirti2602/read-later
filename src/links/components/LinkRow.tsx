import { displayTitle, isPreviewPending, sourceLine } from "../display";
import type { Link } from "../types";
import { Thumbnail } from "./Thumbnail";

const quietButton =
  "hit h-8 rounded-pill px-2 font-display text-sm font-medium text-muted transition-colors duration-(--dur-micro) hover:text-ink active:translate-y-px";
const outlinedButton =
  "hit h-8 rounded-pill border border-ink px-3 font-display text-sm font-medium text-ink transition-colors duration-(--dur-micro) hover:bg-paper-2 active:translate-y-px";

/** One numbered line of the sheet. `now` comes from the per-request render so all rows share one clock. */
export function LinkRow({
  link,
  number,
  now,
  error,
  onDone,
  onDelete,
}: {
  link: Link;
  number: number;
  now: number;
  error?: string;
  onDone?: () => void;
  onDelete: () => void;
}) {
  const loading = isPreviewPending(link, now);
  const title = displayTitle(link);

  return (
    <li
      aria-busy={loading || undefined}
      className="grid grid-cols-[1.5rem_4rem_minmax(0,1fr)] gap-x-3 gap-y-2 border-t border-rule py-4 first:border-t-0 sm:grid-cols-[2rem_5rem_minmax(0,1fr)_auto] sm:gap-x-4"
    >
      <span aria-hidden className="num pt-0.5 text-sm text-muted">
        {String(number).padStart(2, "0")}
      </span>

      <Thumbnail src={link.thumbnail_url} type={link.type} loading={loading} />

      <div className="min-w-0">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`line-clamp-2 font-body text-md leading-snug font-medium break-words underline decoration-transparent decoration-1 underline-offset-[0.16em] transition-colors duration-(--dur-micro) hover:decoration-accent ${
            loading ? "text-muted" : "text-ink"
          }`}
        >
          {title}
        </a>
        <p className={`mt-1 font-body text-sm text-muted ${loading ? "motion-safe:animate-pulse" : ""}`}>
          {loading ? "Fetching details…" : sourceLine(link)}
        </p>
        {error && (
          <p role="alert" className="mt-1 font-body text-sm text-error">
            {error}
          </p>
        )}
      </div>

      <div className="col-span-2 col-start-2 flex items-center justify-between gap-3 sm:col-span-1 sm:col-start-auto sm:flex-col sm:items-end sm:justify-start sm:gap-2">
        <span className="font-body text-sm text-ink-2">
          {link.est_minutes ? (
            <>
              <span className="num">{link.est_minutes}</span> min
            </>
          ) : null}
        </span>
        <div className="flex items-center gap-1">
          {onDone && (
            <button type="button" onClick={onDone} className={outlinedButton}>
              Done<span className="visually-hidden">: {title}</span>
            </button>
          )}
          <button type="button" onClick={onDelete} className={quietButton}>
            Delete<span className="visually-hidden">: {title}</span>
          </button>
        </div>
      </div>
    </li>
  );
}
