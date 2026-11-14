import NextLink from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/auth/current-user";
import { createServerSupabase } from "@/auth/supabase-server";
import { listHref } from "@/shell/nav";
import { MobileNav } from "@/shell/MobileNav";
import { Shortcuts } from "@/shell/Shortcuts";
import { Sidebar } from "@/shell/Sidebar";
import { TitleCount } from "@/shell/TitleCount";
import { formatDay, listSummary, parseType, type TypeFilter } from "../display";
import { countLinks, listLinks, parseView } from "../queries";
import { windowStart } from "../week-window";
import { LayoutSwitch, LinkGrid } from "./LinkGrid";
import { SaveForm } from "./SaveForm";
import { TYPE_META } from "./type-meta";

const FILTERS: { type: TypeFilter; label: string }[] = [
  { type: "all", label: "All" },
  { type: "article", label: "Articles" },
  { type: "video", label: "Videos" },
  { type: "thread", label: "Posts" },
];

/** The signed-in app: one data load feeds the sidebar, the phone bars and the list. */
export async function Workspace({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Session expiry checks and the week window read the clock; that must happen per request.
  await connection();
  const db = await createServerSupabase();
  const user = await getCurrentUser(db);
  if (!user) redirect("/login");

  const params = await searchParams;
  const view = parseView(params.view);
  const type = parseType(params.type);
  const now = new Date();
  const start = windowStart(now, { timeZone: user.timezone, digestDay: user.digestDay, digestTime: user.digestTime });
  const [links, counts] = await Promise.all([
    listLinks(db, user.id, view, start, type),
    countLinks(db, user.id, start),
  ]);
  const { count, minutes, timed } = listSummary(links);
  const weekOf = formatDay(start, user.timezone);
  const heading = view === "week" ? `Week of ${weekOf}` : view === "older" ? `Saved before ${weekOf}` : "Read and watched";

  return (
    <>
      <Sidebar view={view} counts={counts} type={type} />
      <div className="min-w-0">
        <MobileNav view={view} counts={counts} type={type} />
        <main className="mx-auto max-w-(--container-app) px-4 pt-6 pb-28 sm:px-8 lg:pt-8 lg:pb-12">
          <SaveForm />

          <section aria-labelledby="list-heading" className="mt-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <h1 id="list-heading" className="max-w-none text-2xl sm:text-3xl">
                {heading}
              </h1>
              {count > 0 && (
                <p className="text-sm text-muted">
                  <span className="num font-semibold text-ink">{count}</span> {count === 1 ? "link" : "links"}
                  {minutes > 0 && (
                    <>
                      , about <span className="num font-semibold text-ink">{minutes}</span> min
                      {timed < count && (
                        <>
                          {" "}for <span className="num font-semibold text-ink">{timed}</span> of them
                        </>
                      )}
                    </>
                  )}
                </p>
              )}
            </div>

            <div className="mt-4 mb-5 flex flex-wrap items-center justify-between gap-3">
              <nav aria-label="Filter by type" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 py-1">
                {FILTERS.map(({ type: option, label }) => {
                  const current = option === type;
                  const Icon = option === "all" ? null : TYPE_META[option].Icon;
                  return (
                    <NextLink
                      key={option}
                      href={listHref(view, option)}
                      aria-current={current ? "page" : undefined}
                      className={`flex h-9 shrink-0 items-center gap-1.5 rounded-pill px-3.5 text-sm font-semibold no-underline transition-colors duration-(--dur-micro) ${
                        current
                          ? "bg-ink text-paper"
                          : "bg-card text-ink-2 shadow-[inset_0_0_0_1px_var(--color-rule)] hover:bg-paper-2"
                      }`}
                    >
                      {Icon && <Icon aria-hidden className="size-4" />}
                      {label}
                    </NextLink>
                  );
                })}
              </nav>
              <LayoutSwitch />
            </div>

            <LinkGrid links={links} now={now.getTime()} view={view} timeZone={user.timezone} />
          </section>
        </main>
      </div>
      <Shortcuts type={type} />
      <TitleCount count={counts.week} />
    </>
  );
}
