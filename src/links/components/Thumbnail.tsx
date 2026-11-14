"use client";

import { useState } from "react";
import type { LinkType } from "../types";

const TYPE_WORD: Record<LinkType, string> = {
  article: "Article",
  video: "Video",
  thread: "Post",
  other: "Link",
};

const frame = "h-9 w-12 shrink-0 sm:h-14 sm:w-20";

/** Preview image, a pulsing plate while it loads, or the type in words when there is none. */
export function Thumbnail({ src, type, loading = false }: { src: string | null; type: LinkType; loading?: boolean }) {
  const [failed, setFailed] = useState(false);

  if (loading) {
    return <div aria-hidden className={`${frame} bg-paper-2 motion-safe:animate-pulse`} />;
  }

  if (!src || failed) {
    return (
      <div aria-hidden className={`${frame} flex items-center justify-center bg-paper-2 font-body text-xs text-muted`}>
        {TYPE_WORD[type]}
      </div>
    );
  }

  return (
    // Thumbnails come from arbitrary hosts, so next/image's allow-list doesn't fit.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={80}
      height={56}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${frame} object-cover outline-1 -outline-offset-1 outline-rule`}
    />
  );
}
