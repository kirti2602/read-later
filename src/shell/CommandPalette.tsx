"use client";

import {
  CalendarDays,
  CircleCheck,
  CornerDownLeft,
  Inbox,
  LayoutGrid,
  List,
  LogOut,
  Monitor,
  Moon,
  Plus,
  Search,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { signOut } from "@/app/login/actions";
import { PLAY_EVENT } from "@/links/components/LinkGrid";
import { TYPE_META } from "@/links/components/type-meta";
import { displayTitle, youTubeId, type TypeFilter } from "@/links/display";
import { searchLinks, type SearchResult } from "@/links/search";
import { setLayout } from "@/links/view-state";
import { isTypingTarget } from "./keyboard";
import { listHref, NAV } from "./nav";
import { applyMode } from "./ThemeSwitch";

const VIEW_LABEL = { week: "This week", older: "Older", done: "Done" } as const;
const SEARCH_DELAY_MS = 150;

type Command = { id: string; label: string; keys?: string; Icon: LucideIcon; run: () => void };
type Item = { kind: "link"; result: SearchResult } | { kind: "command"; command: Command };

/**
 * ⌘K: search every saved link and every action in one place. With nothing typed it lists the
 * actions with their keys, so it doubles as the shortcuts reference.
 */
export function CommandPalette({ type }: { type: TypeFilter }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<SearchResult[]>([]);
  const [active, setActive] = useState(0);
  const [searching, startSearch] = useTransition();

  const close = () => dialog.current?.close();

  const commands: Command[] = useMemo(
    () => [
      {
        id: "save",
        label: "Save a link",
        keys: "N",
        Icon: Plus,
        run: () => document.getElementById("save-url")?.focus(),
      },
      { id: "search-list", label: "Search this list", keys: "/", Icon: Search, run: () => document.getElementById("list-search")?.focus() },
      ...NAV.map(({ view, label }, i) => ({
        id: `go-${view}`,
        label: `Go to ${label}`,
        keys: String(i + 1),
        Icon: [CalendarDays, Inbox, CircleCheck][i],
        run: () => router.push(listHref(view, type)),
      })),
      { id: "cards", label: "Show as cards", Icon: LayoutGrid, run: () => setLayout("cards") },
      { id: "list", label: "Show as a list", Icon: List, run: () => setLayout("list") },
      { id: "light", label: "Theme: light", Icon: Sun, run: () => applyMode("light") },
      { id: "dark", label: "Theme: dark", Icon: Moon, run: () => applyMode("dark") },
      { id: "auto", label: "Theme: match system", Icon: Monitor, run: () => applyMode("auto") },
      { id: "signout", label: "Sign out", Icon: LogOut, run: () => void signOut() },
    ],
    [router, type],
  );

  const trimmed = query.trim().toLowerCase();
  // Results from an earlier, longer query must not linger once the box is cleared.
  const results = trimmed.length >= 2 ? found : [];
  const matchingCommands = trimmed ? commands.filter((c) => c.label.toLowerCase().includes(trimmed)) : commands;
  const items: Item[] = [
    ...results.map((result) => ({ kind: "link" as const, result })),
    ...matchingCommands.map((command) => ({ kind: "command" as const, command })),
  ];

  // Search the server as you type, a beat after the last keystroke.
  useEffect(() => {
    if (query.trim().length < 2) return;
    const timer = setTimeout(() => {
      startSearch(async () => {
        setFound(await searchLinks(query).catch(() => []));
        setActive(0);
      });
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function open() {
      if (dialog.current?.open) return;
      dialog.current?.showModal();
      input.current?.focus();
    }
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (dialog.current?.open) close();
        else open();
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target) || document.querySelector("dialog[open]")) return;
      if (event.key === "?") {
        event.preventDefault();
        open();
      } else if (event.key === "/") {
        event.preventDefault();
        document.getElementById("list-search")?.focus();
      } else if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        document.getElementById("save-url")?.focus();
      } else if (["1", "2", "3"].includes(event.key)) {
        router.push(listHref(NAV[Number(event.key) - 1].view, type));
      }
    }
    function onClick(event: MouseEvent) {
      if ((event.target as HTMLElement | null)?.closest("[data-palette-open]")) open();
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [router, type]);

  function choose(item: Item) {
    close();
    if (item.kind === "command") {
      item.command.run();
      return;
    }
    const { link } = item.result;
    if (youTubeId(link.url)) window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: link }));
    else window.open(link.url, "_blank", "noopener,noreferrer");
  }

  function onInputKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (items.length ? (i + 1) % items.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (items.length ? (i - 1 + items.length) % items.length : 0));
    } else if (event.key === "Enter" && items[active]) {
      event.preventDefault();
      choose(items[active]);
    }
  }

  const optionId = (i: number) => `${listId}-${i}`;
  const rowClass = (i: number) =>
    `flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-left transition-colors duration-(--dur-micro) ${
      i === active ? "bg-paper-2 text-ink" : "text-ink-2"
    }`;

  return (
    <dialog
      ref={dialog}
      aria-label="Search and shortcuts"
      onClose={() => {
        setQuery("");
        setFound([]);
        setActive(0);
      }}
      onClick={(event) => event.target === dialog.current && close()}
      className="mx-auto mt-[12vh] mb-auto w-[min(36rem,calc(100vw-2rem))] overflow-hidden rounded-card bg-card p-0 text-ink-2 shadow-(--shadow-lift) backdrop:bg-overlay/55"
    >
      <div className="flex items-center gap-3 border-b border-rule px-5">
        <Search aria-hidden className="size-5 shrink-0 text-muted" />
        <input
          ref={input}
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={items[active] ? optionId(active) : undefined}
          aria-label="Search links and actions"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onInputKey}
          placeholder="Search your links, or type a command"
          autoComplete="off"
          spellCheck={false}
          className="h-14 min-w-0 flex-1 bg-transparent text-md text-ink outline-none placeholder:text-muted"
        />
        <kbd className="hidden rounded-control bg-paper-2 px-2 py-1 font-display text-xs font-semibold text-muted sm:inline">esc</kbd>
      </div>

      <div id={listId} role="listbox" aria-label="Results" className="max-h-[min(60vh,28rem)] overflow-y-auto p-2">
        {results.length > 0 && <p className="px-3 pt-2 pb-1 text-xs font-semibold text-muted">Links</p>}
        {results.map((result, i) => {
          const { link, view } = result;
          const { Icon, tint } = TYPE_META[link.type];
          return (
            <button
              key={link.id}
              id={optionId(i)}
              type="button"
              role="option"
              aria-selected={i === active}
              onMouseMove={() => setActive(i)}
              onClick={() => choose({ kind: "link", result })}
              className={rowClass(i)}
            >
              <span className={`grid size-8 shrink-0 place-items-center rounded-control ${tint} text-ink`}>
                <Icon aria-hidden className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-md font-semibold text-ink">{displayTitle(link)}</span>
                <span className="block truncate text-sm text-muted">{link.site ?? new URL(link.url).hostname}</span>
              </span>
              <span className="shrink-0 rounded-pill bg-paper-2 px-2 py-0.5 text-xs font-semibold text-ink-2">{VIEW_LABEL[view]}</span>
            </button>
          );
        })}

        {trimmed.length >= 2 && results.length === 0 && !searching && (
          <p className="px-3 py-3 text-sm text-muted">No saved links match “{query.trim()}”.</p>
        )}

        {matchingCommands.length > 0 && (
          <p className="px-3 pt-3 pb-1 text-xs font-semibold text-muted">{trimmed ? "Actions" : "Actions and shortcuts"}</p>
        )}
        {matchingCommands.map((command, j) => {
          const i = results.length + j;
          return (
            <button
              key={command.id}
              id={optionId(i)}
              type="button"
              role="option"
              aria-selected={i === active}
              onMouseMove={() => setActive(i)}
              onClick={() => choose({ kind: "command", command })}
              className={rowClass(i)}
            >
              <command.Icon aria-hidden className="size-[18px] shrink-0 text-muted" />
              <span className="flex-1 text-md font-medium">{command.label}</span>
              {command.keys && (
                <kbd className="min-w-7 rounded-control bg-paper-2 px-2 py-0.5 text-center font-display text-xs font-semibold text-ink shadow-[0_2px_0_var(--color-edge)]">
                  {command.keys}
                </kbd>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-rule px-5 py-3 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <kbd className="rounded bg-paper-2 px-1.5 py-0.5 font-display font-semibold text-ink-2">↑ ↓</kbd> to move
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="grid place-items-center rounded bg-paper-2 px-1.5 py-0.5 text-ink-2">
            <CornerDownLeft aria-hidden className="size-3" />
          </kbd>
          to open
        </span>
        <span className="hidden items-center gap-1.5 sm:flex">
          <kbd className="rounded bg-paper-2 px-1.5 py-0.5 font-display font-semibold text-ink-2">⌘ K</kbd> to open this anywhere
        </span>
        <span className="hidden items-center gap-1.5 sm:flex">
          <kbd className="rounded bg-paper-2 px-1.5 py-0.5 font-display font-semibold text-ink-2">⌘ V</kbd> saves a copied link
        </span>
      </div>
    </dialog>
  );
}
