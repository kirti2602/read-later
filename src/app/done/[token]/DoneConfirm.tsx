"use client";

import { Check, CircleAlert, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import type { DoneResponse } from "@/app/api/done/route";

type State = { kind: "working" } | { kind: "done"; title: string | null } | { kind: "undone"; title: string | null } | { kind: "error"; message: string };

async function post(token: string, undo: boolean): Promise<DoneResponse> {
  const response = await fetch("/api/done", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token, undo }),
  });
  return response.json().catch(() => ({ error: "Something went wrong. Try again." }));
}

/**
 * Marks the link done only once this page has loaded and run, so email security scanners
 * that fetch links without running JavaScript can't tick things off.
 */
export function DoneConfirm({ token }: { token: string }) {
  const [state, setState] = useState<State>({ kind: "working" });

  useEffect(() => {
    let cancelled = false;
    post(token, false).then((result) => {
      if (cancelled) return;
      setState("error" in result ? { kind: "error", message: result.error } : { kind: "done", title: result.title });
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function undo() {
    setState({ kind: "working" });
    const result = await post(token, true);
    setState("error" in result ? { kind: "error", message: result.error } : { kind: "undone", title: result.title });
  }

  if (state.kind === "working") {
    return (
      <p role="status" className="text-md text-muted">
        Marking it done…
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
      </div>
    );
  }

  const done = state.kind === "done";
  return (
    <div role="status" className="flex flex-col items-center gap-3">
      <span className={`grid size-14 place-items-center rounded-pill animate-pop ${done ? "bg-mint text-mint-ink" : "bg-paper-2 text-ink-2"}`}>
        {done ? <Check aria-hidden className="size-7" strokeWidth={2.8} /> : <RotateCcw aria-hidden className="size-6" />}
      </span>
      <p className="text-lg font-semibold text-ink">{done ? "Marked done" : "Back on your list"}</p>
      {state.title && <p className="max-w-sm text-md text-muted">{state.title}</p>}
      {done && (
        <button
          type="button"
          onClick={undo}
          className="stock mt-1 h-10 rounded-control bg-paper-2 px-4 font-display text-sm font-semibold text-ink hover:bg-paper-3"
        >
          Undo
        </button>
      )}
    </div>
  );
}
