"use client";

import { useRef, useState, useTransition } from "react";
import { deleteLink, markDone, restoreLink } from "../actions";
import { displayTitle } from "../display";
import type { View } from "../queries";
import type { Link } from "../types";
import { LinkRow } from "./LinkRow";

const UNDO_MS = 8000;

type Action = "done" | "deleted";
type Removal = { link: Link; index: number; action: Action; phase: "undoable" | "restoring" };

const without = <T,>(record: Record<string, T>, key: string) =>
  Object.fromEntries(Object.entries(record).filter(([k]) => k !== key));

/**
 * Done and Delete apply at once and leave an Undo in the row's place for a few seconds.
 * The server list drops the row on refresh, so removed rows are kept here until the window closes.
 */
export function LinkList({
  links,
  now,
  view,
  empty,
}: {
  links: Link[];
  now: number;
  view: View;
  empty: { title: string; body: string };
}) {
  const [removals, setRemovals] = useState<Record<string, Removal>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [, startTransition] = useTransition();

  const rows: { link: Link; removal?: Removal }[] = links.map((link) => ({ link, removal: removals[link.id] }));
  for (const removal of Object.values(removals)) {
    if (links.some((l) => l.id === removal.link.id)) continue;
    rows.splice(Math.min(removal.index, rows.length), 0, { link: removal.link, removal });
  }

  function fail(id: string) {
    setErrors((e) => ({ ...e, [id]: "Couldn't update this link. Try again." }));
  }

  function remove(link: Link, index: number, action: Action) {
    setErrors((e) => without(e, link.id));
    setRemovals((r) => ({ ...r, [link.id]: { link, index, action, phase: "undoable" } }));
    clearTimeout(timers.current[link.id]);
    timers.current[link.id] = setTimeout(() => {
      setRemovals((r) => (r[link.id]?.phase === "undoable" ? without(r, link.id) : r));
    }, UNDO_MS);

    startTransition(async () => {
      try {
        await (action === "done" ? markDone(link.id) : deleteLink(link.id));
      } catch {
        clearTimeout(timers.current[link.id]);
        setRemovals((r) => without(r, link.id));
        fail(link.id);
      }
    });
  }

  function undo(removal: Removal) {
    const { id, status } = removal.link;
    clearTimeout(timers.current[id]);
    setRemovals((r) => ({ ...r, [id]: { ...removal, phase: "restoring" } }));
    startTransition(async () => {
      try {
        await restoreLink(id, status === "done" ? "done" : "unread");
        setRemovals((r) => without(r, id));
      } catch {
        setRemovals((r) => ({ ...r, [id]: { ...removal, phase: "undoable" } }));
        fail(id);
      }
    });
  }

  if (rows.length === 0) {
    return (
      <div className="py-10">
        <p className="font-display text-md font-medium text-ink">{empty.title}</p>
        <p className="mt-1 font-body text-sm text-muted">{empty.body}</p>
        {view === "week" && (
          <button
            type="button"
            onClick={() => document.getElementById("save-url")?.focus()}
            className="hit mt-4 h-8 rounded-pill border border-ink px-3 font-display text-sm font-medium text-ink transition-colors duration-(--dur-micro) hover:bg-paper-2 active:translate-y-px"
          >
            Paste a link
          </button>
        )}
      </div>
    );
  }

  return (
    <ol className="list-none p-0">
      {rows.map(({ link, removal }, index) =>
        removal?.phase === "undoable" ? (
          <li
            key={link.id}
            className="flex items-center justify-between gap-4 border-t border-rule py-4 first:border-t-0"
          >
            <p role="status" className="min-w-0 font-body text-sm text-muted">
              <span className="text-ink">{removal.action === "done" ? "Marked done:" : "Deleted:"}</span>{" "}
              <span className="break-words">{displayTitle(link)}</span>
            </p>
            <button
              type="button"
              autoFocus
              onClick={() => undo(removal)}
              className="hit h-8 shrink-0 rounded-pill border border-ink px-3 font-display text-sm font-medium text-ink transition-colors duration-(--dur-micro) hover:bg-paper-2 active:translate-y-px"
            >
              Undo
            </button>
          </li>
        ) : (
          <LinkRow
            key={link.id}
            link={link}
            number={index + 1}
            now={now}
            error={errors[link.id]}
            onDone={link.status === "unread" ? () => remove(link, index, "done") : undefined}
            onDelete={() => remove(link, index, "deleted")}
          />
        ),
      )}
    </ol>
  );
}
