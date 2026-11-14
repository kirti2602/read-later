const ROWS = 3;

/** Placeholder in the shape of the tabs and the sheet while the list loads. */
export function ListSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your list" className="mt-6">
      <div className="flex gap-4 px-3 py-3">
        <div className="h-4 w-16 bg-paper-2 motion-safe:animate-pulse" />
        <div className="h-4 w-20 bg-paper-2 motion-safe:animate-pulse" />
        <div className="h-4 w-10 bg-paper-2 motion-safe:animate-pulse" />
      </div>
      <div className="border-t-2 border-ink bg-sheet px-4 pt-6 pb-2 sm:px-10 sm:pt-10 sm:pb-4">
        <div className="border-b-2 border-rule-2 pb-3">
          <div className="h-7 w-56 bg-paper-2 motion-safe:animate-pulse" />
        </div>
        {Array.from({ length: ROWS }, (_, i) => (
          <div key={i} className="flex gap-4 border-t border-rule py-4 first:border-t-0">
            <div className="h-9 w-12 shrink-0 bg-paper-2 motion-safe:animate-pulse sm:h-14 sm:w-20" />
            <div className="flex flex-1 flex-col gap-2 pt-1">
              <div className="h-4 w-3/4 bg-paper-2 motion-safe:animate-pulse" />
              <div className="h-3 w-1/3 bg-paper-2 motion-safe:animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
