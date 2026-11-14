const CARDS = 4;

/** Placeholder in the shape of the sidebar and the card grid while the workspace loads. */
export function ListSkeleton() {
  return (
    <>
      <div aria-hidden className="hidden h-dvh border-r border-rule bg-paper-2 lg:block" />
      <div aria-busy="true" aria-label="Loading your list" className="mx-auto w-full max-w-(--container-app) px-4 pt-20 sm:px-8 lg:pt-8">
        <div className="shimmer h-12 rounded-input" />
        <div className="shimmer mt-8 h-9 w-72 rounded-control" />
        <div className="mt-5 flex gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="shimmer h-9 w-20 rounded-pill" />
          ))}
        </div>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: CARDS }, (_, i) => (
            <div key={i} className="overflow-hidden rounded-card bg-card shadow-(--shadow-card)">
              <div className="shimmer aspect-video" />
              <div className="flex flex-col gap-2 p-4">
                <div className="shimmer h-4 w-1/3 rounded-pill" />
                <div className="shimmer h-5 w-5/6 rounded-pill" />
                <div className="shimmer h-5 w-2/3 rounded-pill" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
