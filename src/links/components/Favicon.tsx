"use client";

import { useState } from "react";
import { faviconUrl } from "../display";

/** The site's own icon, or its first letter on a soft tile when the site has none. */
export function Favicon({ url, site, className = "size-[18px]" }: { url: string; site: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span aria-hidden className={`${className} grid shrink-0 place-items-center rounded-[5px] bg-paper-3 text-[10px] font-semibold text-ink-2`}>
        {site.charAt(0).toUpperCase()}
      </span>
    );
  }
  return (
    // Favicons come from every saved site, so next/image's host allow-list doesn't fit.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={faviconUrl(url)}
      alt=""
      width={18}
      height={18}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${className} shrink-0 rounded-[5px] bg-paper-2 object-contain`}
    />
  );
}
