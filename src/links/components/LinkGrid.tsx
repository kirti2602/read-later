"use client";

import { Check, CircleCheck, Coffee, Inbox, LayoutGrid, List, Trash2, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore, useTransition, type MouseEvent } from "react";
import { deleteLink, markDone, restoreLink } from "../actions";
import { displayTitle, isPreviewPending, youTubeId } from "../display";
import type { View } from "../queries";
import type { Link } from "../types";
import { LinkCard, type CardProps } from "./LinkCard";
import { LinkRow } from "./LinkRow";
import { VideoPlayer } from "./VideoPlayer";

const UNDO_MS = 8000;
const LAYOUT_KEY = "layout";
const LAYOUT_EVENT = "layoutchange";

type Layout = "cards" | "list";
type Action = "done" | "deleted";
type Removal = { link: Link; index: number; action: Action; phase: "undoable" | "restoring" };

const EMPTY: Record<View, { title: string; body: string; Icon: LucideIcon }> = {
  week: { title: "Nothing saved this week yet", body: "Paste a link above, or press ⌘V anywhere on the page.", Icon: Coffee },
  older: { title: "No older unread links", body: "Anything left unread moves here when a new week starts on Saturday.", Icon: Inbox },
  done: { title: "Nothing finished yet", body: "Links you mark done land here, so you can see what you got through.", Icon: CircleCheck },
};

const without = <T,>(record: Record<string, T>, key: string) =>
  Object.fromEntries(Object.entries(record).filter(([k]) => k !== key));

function readLayout(): Layout {
  try {
    return localStorage.getItem(LAYOUT_KEY) === "list" ? "list" : "cards";
  } catch {
    return "cards";
  }
}
function subscribeLayout(onChange: () => void) {
  window.addEventListener(LAYOUT_EVENT, onChange);
  return () => window.removeEventListener(LAYOUT_EVENT, onChange);
}
function setLayout(layout: Layout) {
  try {
    localStorage.setItem(LAYOUT_KEY, layout);
  } catch {
    // Storage can be blocked; the layout still switches for this visit.
  }
  window.dispatchEvent(new Event(LAYOUT_EVENT));
}

/** Cards or a list switch, remembered per browser. */
export function LayoutSwitch() {
  const layout = useSyncExternalStore(subscribeLayout, readLayout, () => "cards" as Layout);
  const options: { value: Layout; label: string; Icon: LucideIcon }[] = [
    { value: "cards", label: "Cards", Icon: LayoutGrid },
    { value: "list", label: "List", Icon: List },
  ];
  return (
    <div role="group" aria-label="Layout" className="inline-flex rounded-pill bg-paper-2 p-0.5 shadow-[inset_0_0_0_1px_var(--color-rule)]">
      {options.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={layout === value}
          aria-label={label}
          title={label}
          onClick={() => setLayout(value)}
          className={`hit grid h-8 w-10 place-items-center rounded-pill transition-colors duration-(--dur-micro) ${
            layout === value ? "bg-card text-ink shadow-(--shadow-card)" : "text-muted hover:text-ink"
          }`}
        >
          <Icon aria-hidden className="size-4" />
        </button>
      ))}
    </div>
  );
}

/**
 * The list body. Done and Delete apply at once and leave an Undo in the item's place; the server
 * list drops removed items on refresh, so they are held here until the undo window closes.
 */
export function LinkGrid({ links, now, view, timeZone }: { links: Link[]; now: number; view: View; timeZone: string }) {
  const layout = useSyncExternalStore(subscribeLayout, readLayout, () => "cards" as Layout);
  const [removals, setRemovals] = useState<Record<string, Removal>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [nudgeId, setNudgeId] = useState<string | null>(null);
  const [playing, setPlaying] = useState<Link | null>(null);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [, startTransition] = useTransition();

  // "Finished it?": when you come back to this tab after opening a link, that item asks.
  useEffect(() => {
    if (!openedId) return;
    function onVisible() {
      if (document.visibilityState === "visible") setNudgeId(openedId);
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [openedId]);

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
    if (nudgeId === link.id) setNudgeId(null);
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

  function open(link: Link, event: MouseEvent<HTMLAnchorElement>) {
    // Plain clicks on a video play it here; modified clicks (new tab, etc.) keep the browser's behaviour.
    const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
    if (!modified && youTubeId(link.url)) {
      event.preventDefault();
      setPlaying(link);
      return;
    }
    if (link.status === "unread") setOpenedId(link.id);
  }

  if (rows.length === 0) {
    const { title, body, Icon } = EMPTY[view];
    return (
      <div className="flex flex-col items-center rounded-card bg-card px-6 py-14 text-center shadow-(--shadow-card)">
        <span className="grid size-14 place-items-center rounded-pill bg-accent text-accent-ink">
          <Icon aria-hidden className="size-6" />
        </span>
        <p className="mt-4 font-display text-lg font-semibold text-ink">{title}</p>
        <p className="mt-1 max-w-sm text-md text-muted">{body}</p>
        {view === "week" && (
          <button
            type="button"
            onClick={() => document.getElementById("save-url")?.focus()}
            className="stock mt-5 h-11 rounded-stock bg-paper-2 px-5 font-display text-md font-semibold text-ink hover:bg-paper-3"
          >
            Paste a link
          </button>
        )}
      </div>
    );
  }

  function renderItem(link: Link, index: number) {
    const props: CardProps = {
      link,
      now,
      timeZone,
      loading: isPreviewPending(link, now),
      nudge: nudgeId === link.id,
      error: errors[link.id],
      onOpen: (event) => open(link, event),
      onDone: link.status === "unread" ? () => remove(link, index, "done") : undefined,
      onDelete: () => remove(link, index, "deleted"),
      onDismissNudge: () => setNudgeId(null),
    };
    if (layout === "list") return <LinkRow key={link.id} {...props} />;
    return (
      <li key={link.id} className="flex flex-col [&>article]:flex-1">
        <LinkCard {...props} />
      </li>
    );
  }

  return (
    <>
      <ol
        className={`m-0 list-none p-0 ${
          layout === "list" ? "flex flex-col gap-3" : "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
        }`}
      >
        {rows.map(({ link, removal }, index) =>
          removal?.phase === "undoable" ? (
            <li
              key={link.id}
              className={`flex items-center gap-3 rounded-card bg-paper-2 p-4 shadow-[inset_0_0_0_1px_var(--color-rule)] ${
                layout === "cards" ? "min-h-40 flex-col justify-center text-center" : ""
              }`}
            >
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-pill animate-pop ${
                  removal.action === "done" ? "bg-mint text-mint-ink" : "bg-paper-3 text-ink-2"
                }`}
              >
                {removal.action === "done" ? <Check aria-hidden className="size-5" strokeWidth={2.8} /> : <Trash2 aria-hidden className="size-5" />}
              </span>
              <p role="status" className={`min-w-0 text-sm text-muted ${layout === "list" ? "flex-1" : ""}`}>
                <span className="font-semibold text-ink">{removal.action === "done" ? "Marked done" : "Deleted"}</span>{" "}
                <span className="line-clamp-1 break-all">{displayTitle(link)}</span>
              </p>
              <button
                type="button"
                autoFocus
                onClick={() => undo(removal)}
                className="stock h-10 shrink-0 rounded-control bg-paper-3 px-4 font-display text-sm font-semibold text-ink"
              >
                Undo
              </button>
            </li>
          ) : (
            renderItem(link, index)
          ),
        )}
      </ol>
      <VideoPlayer
        link={playing}
        onClose={() => setPlaying(null)}
        onDone={
          playing?.status === "unread"
            ? () => {
                const index = rows.findIndex((r) => r.link.id === playing.id);
                remove(playing, Math.max(index, 0), "done");
              }
            : undefined
        }
      />
    </>
  );
}
