import { LinkIcon } from "lucide-react";
import NextLink from "next/link";
import { Suspense } from "react";
import { extractSharedUrl } from "@/links/shared-url";
import { ShareSave } from "./ShareSave";

export const metadata = { title: "Save · Read Later", robots: { index: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/**
 * Where every capture path lands: the Android share sheet (the app's share target), the
 * iPhone Shortcut and the extension's fallback all open `/share?url=…` (or `?text=…`).
 */
export default function SharePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-card bg-card px-8 py-10 text-center shadow-(--shadow-card)">
        <Suspense fallback={<p className="text-md text-muted">Saving…</p>}>
          <ShareBody searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function ShareBody({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const url = extractSharedUrl({ url: one(params.url), text: one(params.text), title: one(params.title) });

  if (!url) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3">
        <span className="grid size-14 place-items-center rounded-pill bg-paper-2 text-ink-2">
          <LinkIcon aria-hidden className="size-6" />
        </span>
        <p className="text-lg font-semibold text-ink">Nothing to save</p>
        <p className="max-w-sm text-md text-muted">That share didn&apos;t include a web link. Try sharing the page itself.</p>
        <NextLink href="/" className="text-sm font-semibold text-link no-underline hover:underline">
          Open your list
        </NextLink>
      </div>
    );
  }
  return <ShareSave url={url} />;
}
