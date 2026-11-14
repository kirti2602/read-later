import { Suspense } from "react";
import { ListSkeleton } from "@/links/components/ListSkeleton";
import { ReadingList } from "@/links/components/ReadingList";
import { SaveForm } from "@/links/components/SaveForm";
import { AppHeader } from "@/shell/AppHeader";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <>
      <AppHeader signedIn />
      <main className="mx-auto max-w-(--container-app) px-4 py-6 sm:px-6 sm:py-10">
        <div className="border-t-2 border-ink bg-sheet px-4 pt-6 pb-4 sm:px-10 sm:pt-10 sm:pb-6">
          <SaveForm />
          <Suspense fallback={<ListSkeleton />}>
            <ReadingList searchParams={searchParams} />
          </Suspense>
        </div>
      </main>
    </>
  );
}
