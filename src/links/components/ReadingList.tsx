import NextLink from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/auth/current-user";
import { createServerSupabase } from "@/auth/supabase-server";
import { formatDay, listSummary } from "../display";
import { listLinks, parseView, type View } from "../queries";
import { windowStart } from "../week-window";
import { LinkList } from "./LinkList";

const TABS: { view: View; label: string }[] = [
  { view: "week", label: "This week" },
  { view: "older", label: "Older unread" },
  { view: "done", label: "Done" },
];

const EMPTY: Record<View, { title: string; body: string }> = {
  week: { title: "Nothing saved this week yet.", body: "Paste a link above and it starts this week's list." },
  older: { title: "No older unread links.", body: "Anything you leave unread moves here when a new week starts on Saturday." },
  done: { title: "Nothing finished yet.", body: "Links you mark done land here." },
};

export async function ReadingList({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Session expiry checks and the week window read the clock; that must happen per request.
  await connection();
  const db = await createServerSupabase();
  const user = await getCurrentUser(db);
  if (!user) redirect("/login");

  const view = parseView((await searchParams).view);
  const now = new Date();
  const start = windowStart(now, {
    timeZone: user.timezone,
    digestDay: user.digestDay,
    digestTime: user.digestTime,
  });
  const links = await listLinks(db, user.id, view, start);
  const { count, minutes } = listSummary(links);
  const weekOf = formatDay(start, user.timezone);
  const heading =
    view === "week" ? `Week of ${weekOf}` : view === "older" ? `Saved before ${weekOf}` : "Read and watched";

  return (
    <section aria-labelledby="sheet-heading" className="mt-4">
      <nav aria-label="Views" className="-mx-1 flex gap-1 overflow-x-auto border-b border-rule">
        {TABS.map((tab) => {
          const current = tab.view === view;
          return (
            <NextLink
              key={tab.view}
              href={tab.view === "week" ? "/" : `/?view=${tab.view}`}
              aria-current={current ? "page" : undefined}
              className={`-mb-px shrink-0 border-b-2 px-3 py-3 font-body text-sm whitespace-nowrap no-underline transition-colors duration-(--dur-micro) ${
                current ? "border-accent font-medium text-ink" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {tab.label}
            </NextLink>
          );
        })}
      </nav>

      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b-2 border-rule-2 pb-3">
        <h1 id="sheet-heading" className="text-xl sm:text-2xl">
          {heading}
        </h1>
        {count > 0 && (
          <p className="font-body text-sm text-muted">
            <span className="num text-ink-2">{count}</span> {count === 1 ? "link" : "links"}
            {minutes > 0 && (
              <>
                , about <span className="num text-ink-2">{minutes}</span> min
              </>
            )}
          </p>
        )}
      </div>

      <LinkList links={links} now={now.getTime()} view={view} empty={EMPTY[view]} />
    </section>
  );
}
