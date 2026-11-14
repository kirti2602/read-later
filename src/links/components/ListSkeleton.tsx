const ROWS = 3;

/** Placeholder in the shape of the sheet while the list loads. */
export function ListSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your list" className="mt-8">
      <div className="h-10 border-b border-rule" />
      <div className="mt-6 h-8 w-48 bg-paper-2 motion-safe:animate-pulse" />
      <div className="mt-4 border-t-2 border-rule-2">
        {Array.from({ length: ROWS }, (_, i) => (
          <div key={i} className="flex gap-4 border-t border-rule py-4 first:border-t-0">
            <div className="h-12 w-16 shrink-0 bg-paper-2 motion-safe:animate-pulse sm:h-14 sm:w-20" />
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
