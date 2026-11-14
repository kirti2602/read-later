"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import type { TypeFilter } from "@/links/display";
import { isTypingTarget } from "./keyboard";
import { listHref, NAV } from "./nav";

const SHORTCUTS: [string, string][] = [
  ["/", "Jump to the save field"],
  ["⌘ V", "Paste a link anywhere to save it"],
  ["1  2  3", "This week, Older unread, Done"],
  ["?", "Show these shortcuts"],
];

/** Keyboard shortcuts plus the help dialog; ignored while typing or with a modifier held. */
export function Shortcuts({ type }: { type: TypeFilter }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;
      if (document.querySelector("dialog[open]") && event.key !== "?") return;
      if (event.key === "/") {
        event.preventDefault();
        document.getElementById("save-url")?.focus();
      } else if (event.key === "?") {
        event.preventDefault();
        if (dialog.current?.open) dialog.current.close();
        else dialog.current?.showModal();
      } else if (["1", "2", "3"].includes(event.key)) {
        router.push(listHref(NAV[Number(event.key) - 1].view, type));
      }
    }
    function onClick(event: MouseEvent) {
      if ((event.target as HTMLElement | null)?.closest("[data-shortcuts-open]")) dialog.current?.showModal();
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [router, type]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="shortcuts-title"
      onClick={(event) => event.target === dialog.current && dialog.current?.close()}
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-card bg-card p-0 text-ink-2 shadow-(--shadow-lift) backdrop:bg-overlay/50"
    >
      <div className="flex items-center justify-between px-6 pt-5">
        <h2 id="shortcuts-title" className="text-lg">
          Keyboard shortcuts
        </h2>
        <button
          type="button"
          aria-label="Close"
          onClick={() => dialog.current?.close()}
          className="hit grid size-9 place-items-center rounded-control text-muted hover:bg-paper-2 hover:text-ink"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 px-6 pt-4 pb-6">
        {SHORTCUTS.map(([keys, action]) => (
          <div key={keys} className="contents">
            <dt>
              <kbd className="inline-flex min-w-9 justify-center rounded-control bg-paper-2 px-2 py-1 font-display text-sm font-semibold text-ink shadow-[0_2px_0_var(--color-edge)]">
                {keys}
              </kbd>
            </dt>
            <dd className="m-0 self-center text-md">{action}</dd>
          </div>
        ))}
      </dl>
    </dialog>
  );
}
