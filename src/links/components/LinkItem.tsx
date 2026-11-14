import { deleteLink, markDone } from "../actions";
import type { Link, LinkType } from "../types";

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

export function LinkItem({ link }: { link: Link }) {
  const { icon, label } = TYPE_ICONS[link.type];
  const title = link.title ?? link.url;
  const meta = [link.site, duration(link)].filter(Boolean).join(" · ");

  return (
    <li className="flex gap-3 border-b border-zinc-200 py-3 dark:border-zinc-800">
      {link.thumbnail_url ? (
        // Thumbnails come from arbitrary hosts, so next/image's allow-list doesn't fit.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={link.thumbnail_url}
          alt=""
          width={80}
          height={56}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-14 w-20 shrink-0 rounded object-cover"
        />
      ) : (
        <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded bg-zinc-100 text-2xl dark:bg-zinc-800" aria-hidden>
          {icon}
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="line-clamp-2 font-medium break-words hover:underline"
        >
          {title}
        </a>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          <span role="img" aria-label={label}>
            {icon}
          </span>{" "}
          {meta}
        </p>
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
