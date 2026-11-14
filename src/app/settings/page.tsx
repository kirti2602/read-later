import { CalendarClock, Mail } from "lucide-react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { getCurrentUser } from "@/auth/current-user";
import { createServerSupabase } from "@/auth/supabase-server";
import { ListSkeleton } from "@/links/components/ListSkeleton";
import { countLinks } from "@/links/queries";
import { windowStart } from "@/links/week-window";
import { CommandPalette } from "@/shell/CommandPalette";
import { MobileNav } from "@/shell/MobileNav";
import { Sidebar } from "@/shell/Sidebar";
import { TestDigestButton } from "./TestDigestButton";

export const metadata = { title: "Settings · Read Later" };

const STATUS_TEXT = { sent: "Sent", pending: "Sending", failed: "Failed" } as const;

export default function SettingsPage() {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[var(--sidebar)_minmax(0,1fr)]">
      <Suspense fallback={<ListSkeleton />}>
        <Settings />
      </Suspense>
    </div>
  );
}

async function Settings() {
  await connection();
  const db = await createServerSupabase();
  const user = await getCurrentUser(db);
  if (!user) redirect("/login");

  const start = windowStart(new Date(), { timeZone: user.timezone, digestDay: user.digestDay, digestTime: user.digestTime });
  const [counts, { data: lastDigest }] = await Promise.all([
    countLinks(db, user.id, start),
    db
      .from("digests")
      .select("status, sent_at, created_at, link_ids")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ status: keyof typeof STATUS_TEXT; sent_at: string | null; created_at: string; link_ids: string[] }>(),
  ]);
  const when = (iso: string) =>
    new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: user.timezone }).format(new Date(iso));

  return (
    <>
      <Sidebar view="settings" counts={counts} type="all" />
      <div className="min-w-0">
        <MobileNav view="settings" counts={counts} type="all" />
        <main className="mx-auto max-w-(--container-app) px-4 pt-6 pb-28 sm:px-8 lg:pt-8 lg:pb-12">
          <h1 className="max-w-none text-2xl sm:text-3xl">Settings</h1>

          <section aria-labelledby="digest-heading" className="mt-6 max-w-2xl rounded-card bg-card p-6 shadow-(--shadow-card) sm:p-8">
            <h2 id="digest-heading" className="max-w-none text-xl">
              Weekly digest
            </h2>
            <p className="mt-1 text-md text-muted">
              One email with the week&apos;s unread links, then anything left from the week before. Tap Done in the email to tick a link off; no sign-in needed.
            </p>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="flex gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-pill bg-tint-post text-ink">
                  <CalendarClock aria-hidden className="size-5" />
                </span>
                <div>
                  <dt className="text-sm text-muted">When</dt>
                  <dd className="m-0 text-md font-semibold text-ink">Saturdays at 9:00 (IST)</dd>
                </div>
              </div>
              <div className="flex min-w-0 gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-pill bg-tint-article text-ink">
                  <Mail aria-hidden className="size-5" />
                </span>
                <div className="min-w-0">
                  <dt className="text-sm text-muted">Sent to</dt>
                  <dd className="m-0 truncate text-md font-semibold text-ink">{user.email}</dd>
                </div>
              </div>
            </dl>

            <p className="mt-6 text-sm text-muted">
              {lastDigest
                ? `Last digest: ${STATUS_TEXT[lastDigest.status]}, ${when(lastDigest.sent_at ?? lastDigest.created_at)}, ${lastDigest.link_ids.length} ${lastDigest.link_ids.length === 1 ? "link" : "links"}.`
                : "No digest sent yet. The first one goes out this Saturday if you have unread links."}
            </p>

            <div className="mt-6 border-t border-rule pt-6">
              <h3 className="max-w-none text-md">Try it now</h3>
              <p className="mt-1 mb-4 text-sm text-muted">Emails you what Saturday&apos;s digest would hold right now, marked as a test. It doesn&apos;t affect the real one.</p>
              <TestDigestButton />
            </div>
          </section>
        </main>
      </div>
      <CommandPalette type="all" />
    </>
  );
}
