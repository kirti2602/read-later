"use client";

import { useState } from "react";

/** Preview image, or the type icon when there is none or the host refuses to serve it. */
export function Thumbnail({ src, icon }: { src: string | null; icon: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className="flex h-14 w-20 shrink-0 items-center justify-center rounded bg-zinc-100 text-2xl dark:bg-zinc-800"
        aria-hidden
      >
        {icon}
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
      className="h-14 w-20 shrink-0 rounded object-cover"
    />
  );
}
