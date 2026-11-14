import { LogOut, Search } from "lucide-react";
import NextLink from "next/link";
import { signOut } from "@/app/login/actions";
import type { TypeFilter } from "@/links/display";
import type { View, ViewCounts } from "@/links/queries";
import { listHref, NAV } from "./nav";
import { ThemeSwitch } from "./ThemeSwitch";

/** Phone chrome (under 60rem): a slim top bar and a bottom tab bar within thumb reach. */
export function MobileNav({ view, counts, type }: { view: View; counts: ViewCounts; type: TypeFilter }) {
  return (
    <>
      <header className="sticky top-0 z-(--z-sticky-nav) flex h-14 items-center justify-between border-b border-rule bg-paper px-4 lg:hidden">
        <NextLink href="/" aria-label="Read Later, home" className="font-display text-lg font-semibold tracking-(--tracking-display) text-ink no-underline">
          Read Later
        </NextLink>
        <div className="flex items-center gap-1">
          <button
            type="button"
            data-palette-open
            aria-label="Search"
            className="hit grid size-9 place-items-center rounded-control text-muted transition-colors duration-(--dur-micro) hover:text-ink"
          >
            <Search aria-hidden className="size-[18px]" />
          </button>
          <ThemeSwitch />
          <form action={signOut}>
            <button
              type="submit"
              aria-label="Sign out"
              className="hit grid size-9 place-items-center rounded-control text-muted transition-colors duration-(--dur-micro) hover:text-ink"
            >
              <LogOut aria-hidden className="size-[18px]" />
            </button>
          </form>
        </div>
      </header>

      <nav
        aria-label="Views"
        className="fixed inset-x-0 bottom-0 z-(--z-sticky-nav) grid grid-cols-3 border-t border-rule bg-paper px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] lg:hidden"
      >
        {NAV.map(({ view: item, short, Icon }) => {
          const current = item === view;
          return (
            <NextLink
              key={item}
              href={listHref(item, type)}
              aria-current={current ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 rounded-control py-1.5 font-display text-xs font-medium no-underline transition-colors duration-(--dur-micro) ${
                current ? "text-ink" : "text-muted"
              }`}
            >
              <span className={`relative grid h-7 w-12 place-items-center rounded-pill ${current ? "bg-accent text-accent-ink" : ""}`}>
                <Icon aria-hidden className="size-[18px]" />
              </span>
              <span>
                {short} <span className="num">{counts[item]}</span>
              </span>
            </NextLink>
          );
        })}
      </nav>
    </>
  );
}
