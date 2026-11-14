"use client";

import { CloudOff } from "lucide-react";

export default function ErrorPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="flex max-w-md flex-col items-center rounded-card bg-card px-8 py-10 text-center shadow-(--shadow-card)">
        <span className="grid size-14 place-items-center rounded-pill bg-tint-video text-ink">
          <CloudOff aria-hidden className="size-6" />
        </span>
        <h1 className="mt-4 text-2xl">Couldn&apos;t load your list</h1>
        <p className="mt-2 text-md text-muted">The server didn&apos;t respond. Your links are safe; try again in a moment.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="stock mt-6 h-12 rounded-stock bg-accent px-6 font-display text-md font-semibold text-accent-ink [--stock-edge:var(--color-accent-deep)]"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
