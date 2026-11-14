import NextLink from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/current-user";
import { createServerSupabase } from "@/auth/supabase-server";
import { listLinks, parseView, type View } from "../queries";
import { windowStart } from "../week-window";
import { LinkItem } from "./LinkItem";

const TABS: { view: View; label: string; empty: string }[] = [
  { view: "week", label: "This week", empty: "Nothing saved this week yet." },
  { view: "older", label: "Older unread", empty: "No older unread links." },
  { view: "done", label: "Done", empty: "Nothing marked done yet." },
];

export async function ReadingList({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const db = await createServerSupabase();
  const user = await getCurrentUser(db);
  if (!user) redirect("/login");

  const view = parseView((await searchParams).view);
  const start = windowStart(new Date(), {
    timeZone: user.timezone,
    digestDay: user.digestDay,
    digestTime: user.digestTime,
  });
  const links = await listLinks(db, user.id, view, start);
  const current = TABS.find((t) => t.view === view)!;

  return (
    <section className="flex flex-col gap-2">
      <nav className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800" aria-label="Views">
        {TABS.map((tab) => (
          <NextLink
            key={tab.view}
            href={tab.view === "week" ? "/" : `/?view=${tab.view}`}
            aria-current={tab.view === view ? "page" : undefined}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${
              tab.view === view
                ? "border-zinc-900 font-medium dark:border-zinc-100"
                : "border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            {tab.label}
          </NextLink>
        ))}
      </nav>
      {links.length === 0 ? (
        <p className="py-8 text-center text-zinc-600 dark:text-zinc-400">{current.empty}</p>
      ) : (
        <ul>
          {links.map((link) => (
            <LinkItem key={link.id} link={link} />
          ))}
        </ul>
      )}
    </section>
  );
}
