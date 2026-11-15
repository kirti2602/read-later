"use client";

import { Check, CircleAlert, Copy } from "lucide-react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type State =
  | { kind: "saving" }
  | { kind: "saved"; title: string; already: boolean; done: boolean }
  | { kind: "error"; message: string };

const hostname = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

/** Saves the shared link once this page has loaded, then says so. */
export function ShareSave({ url }: { url: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "saving" });
  // React runs effects twice in development; without this the second run would report "Already saved".
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        const response = await fetch("/api/links", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url, source: "share" }),
        });
        const body = await response.json().catch(() => null);
        if (response.status === 401) {
          router.replace(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
          return;
        }
        if (!response.ok) {
          setState({ kind: "error", message: body?.error ?? "Couldn't save that link. Try again." });
          return;
        }
        setState({
          kind: "saved",
          title: body.link?.title ?? hostname(url),
          already: body.result === "already_saved",
          done: body.link?.status === "done",
        });
      } catch {
        setState({ kind: "error", message: "Couldn't reach Read Later. Check your connection and try again." });
      }
    })();
  }, [url, router]);

  if (state.kind === "saving") {
    return (
      <p role="status" className="text-md text-muted">
        Saving…
      </p>
    );
  }

  if (state.kind === "error") {
    return (
      <div role="alert" className="flex flex-col items-center gap-3">
        <span className="grid size-14 place-items-center rounded-pill bg-tint-video text-ink">
          <CircleAlert aria-hidden className="size-6" />
        </span>
        <p className="text-lg font-semibold text-ink">{state.message}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="stock h-11 rounded-stock bg-accent px-5 font-display text-md font-semibold text-accent-ink [--stock-edge:var(--color-accent-deep)]"
        >
          Try again
        </button>
      </div>
    );
  }

  const heading = state.already ? (state.done ? "Already read this week" : "Already in this week's list") : "Saved ✓";
  return (
    <div role="status" className="flex flex-col items-center gap-3">
      <span className={`grid size-14 place-items-center rounded-pill animate-pop ${state.already ? "bg-paper-2 text-ink-2" : "bg-mint text-mint-ink"}`}>
        {state.already ? <Copy aria-hidden className="size-6" /> : <Check aria-hidden className="size-7" strokeWidth={2.8} />}
      </span>
      <p className="text-lg font-semibold text-ink">{heading}</p>
      <p className="max-w-sm text-md text-muted">{state.title}</p>
      <p className="text-sm text-muted">You can go back to where you were.</p>
      <NextLink
        href="/"
        className="stock mt-1 inline-flex h-11 items-center rounded-stock bg-paper-2 px-5 font-display text-md font-semibold text-ink no-underline hover:bg-paper-3"
      >
        Open your list
      </NextLink>
    </div>
  );
}
