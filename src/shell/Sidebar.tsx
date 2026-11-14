import { LogOut, Search } from "lucide-react";
import NextLink from "next/link";
import { signOut } from "@/app/login/actions";
import type { TypeFilter } from "@/links/display";
import type { View, ViewCounts } from "@/links/queries";
import { FocusSaveButton } from "./FocusSaveButton";
import { listHref, NAV } from "./nav";
import { ThemeSwitch } from "./ThemeSwitch";

const quietButton =
  "hit flex h-9 items-center gap-2 rounded-control px-2 font-display text-sm font-medium text-muted transition-colors duration-(--dur-micro) hover:bg-paper-3 hover:text-ink";

/** Desktop navigation (60rem and up); phones get MobileNav instead. */
export function Sidebar({ view, counts, type }: { view: View; counts: ViewCounts; type: TypeFilter }) {
  return (
    <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r border-rule bg-paper-2 px-4 pt-7 pb-5 lg:flex">
      <NextLink href="/" aria-label="Read Later, home" className="px-2 font-display text-xl font-semibold tracking-(--tracking-display) text-ink no-underline">
        Read Later
      </NextLink>

      <FocusSaveButton />

      <button
        type="button"
        data-palette-open
        className="flex h-10 items-center gap-2 rounded-control bg-paper px-3 text-sm text-muted shadow-[inset_0_0_0_1px_var(--color-rule)] transition-colors duration-(--dur-micro) hover:text-ink"
      >
        <Search aria-hidden className="size-4" />
        <span className="flex-1 text-left">Search</span>
        <kbd className="rounded-[6px] bg-paper-2 px-1.5 py-0.5 font-display text-xs font-semibold">⌘K</kbd>
      </button>

      <nav aria-label="Views" className="flex flex-col gap-1">
        {NAV.map(({ view: item, label, Icon }) => {
          const current = item === view;
          return (
            <NextLink
              key={item}
              href={listHref(item, type)}
              aria-current={current ? "page" : undefined}
              className={`flex h-11 items-center gap-3 rounded-control px-3 font-display text-md font-medium no-underline transition-colors duration-(--dur-micro) ${
                current ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-3"
              }`}
            >
              <Icon aria-hidden className="size-[18px] shrink-0" />
              <span className="flex-1">{label}</span>
              <span className="num text-sm opacity-80">{counts[item]}</span>
            </NextLink>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <ThemeSwitch />
        <div className="flex items-center justify-between">
          <form action={signOut}>
            <button type="submit" className={quietButton}>
              <LogOut aria-hidden className="size-4" />
              Sign out
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
