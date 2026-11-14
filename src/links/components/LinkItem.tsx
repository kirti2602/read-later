import { deleteLink, markDone } from "../actions";
import { displayTitle, isPreviewPending } from "../display";
import type { Link, LinkType } from "../types";
import { Thumbnail } from "./Thumbnail";

const TYPE_ICONS: Record<LinkType, { icon: string; label: string }> = {
  article: { icon: "📄", label: "Article" },
  video: { icon: "▶️", label: "Video" },
  thread: { icon: "🧵", label: "Thread" },
  other: { icon: "🔗", label: "Link" },
};

function duration(link: Link): string | null {
  if (!link.est_minutes) return null;
  return link.type === "video" ? `${link.est_minutes} min video` : `${link.est_minutes} min read`;
}

const buttonClass =
  "rounded-md border border-zinc-300 px-2.5 py-1 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800";

/** `now` comes from the per-request render so every item judges "still loading" against one clock. */
export function LinkItem({ link, now }: { link: Link; now: number }) {
  const { icon, label } = TYPE_ICONS[link.type];
  const loading = isPreviewPending(link, now);
  const title = displayTitle(link);
  const meta = [link.site, duration(link)].filter(Boolean).join(" · ");

  return (
    <li className="flex gap-3 border-b border-zinc-200 py-3 dark:border-zinc-800" aria-busy={loading}>
      <Thumbnail src={link.thumbnail_url} icon={icon} loading={loading} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`line-clamp-2 font-medium break-words hover:underline ${loading ? "text-zinc-500 dark:text-zinc-400" : ""}`}
        >
          {title}
        </a>
        {loading ? (
          <p className="text-sm text-zinc-500 motion-safe:animate-pulse dark:text-zinc-400">
            Fetching details…
          </p>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            <span role="img" aria-label={label}>
              {icon}
            </span>{" "}
            {meta}
          </p>
        )}
        <div className="flex gap-2">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${title}`}
            className={buttonClass}
          >
            Open
          </a>
          {link.status === "unread" && (
            <form action={markDone.bind(null, link.id)}>
              <button aria-label={`Mark done: ${title}`} className={buttonClass}>
                Done
              </button>
            </form>
          )}
          <form action={deleteLink.bind(null, link.id)}>
            <button aria-label={`Delete ${title}`} className={buttonClass}>
              Delete
            </button>
          </form>
        </div>
      </div>
    </li>
  );
}
