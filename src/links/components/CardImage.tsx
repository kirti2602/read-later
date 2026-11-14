"use client";

import { useState } from "react";
import type { LinkType } from "../types";
import { TYPE_META } from "./type-meta";

/** The card's picture: fades in once loaded; a tinted plate with the type icon when there is none. */
export function CardImage({ src, type, className = "" }: { src: string | null; type: LinkType; className?: string }) {
  const [state, setState] = useState<"loading" | "loaded" | "failed">("loading");
  const { Icon, tint } = TYPE_META[type];

  if (!src || state === "failed") {
    return (
      <div aria-hidden className={`${className} ${tint} grid place-items-center text-ink/45`}>
        <Icon className="size-10" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    // Thumbnails come from arbitrary hosts, so next/image's allow-list doesn't fit.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      // A cached image can finish before hydration attaches onLoad; catch that here or it stays invisible.
      ref={(img) => {
        if (img?.complete && img.naturalWidth > 0 && state === "loading") setState("loaded");
      }}
      onLoad={() => setState("loaded")}
      onError={() => setState("failed")}
      className={`${className} bg-paper-2 object-cover transition-[opacity,transform] duration-(--dur-long) ease-(--ease-snap) ${
        state === "loaded" ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}
