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
        <SaveForm />
        <Suspense fallback={<ListSkeleton />}>
          <ReadingList searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}
