import { Suspense } from "react";
import { ListSkeleton } from "@/links/components/ListSkeleton";
import { Workspace } from "@/links/components/Workspace";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[var(--sidebar)_minmax(0,1fr)]">
      <Suspense fallback={<ListSkeleton />}>
        <Workspace searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
