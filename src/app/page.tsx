import { Suspense } from "react";
import { signOut } from "@/app/login/actions";
import { ReadingList } from "@/links/components/ReadingList";
import { SaveForm } from "@/links/components/SaveForm";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Read Later</h1>
        <form action={signOut}>
          <button className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">Sign out</button>
        </form>
      </header>
      <SaveForm />
      <Suspense fallback={<p className="py-8 text-center text-zinc-500">Loading…</p>}>
        <ReadingList searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
