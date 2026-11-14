"use client";

export default function ErrorPage() {
  return (
    <main className="mx-auto max-w-(--container-app) px-4 py-6 sm:px-6 sm:py-10">
      <div className="max-w-md border-t-2 border-ink bg-sheet px-4 pt-6 pb-6 sm:px-10 sm:pt-10 sm:pb-10">
        <h1 className="text-xl sm:text-2xl">Couldn&apos;t load your list</h1>
        <p className="mt-2 font-body text-md text-ink-2">
          The server didn&apos;t respond. Your links are safe; try again in a moment.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 h-10 rounded-pill bg-accent px-6 font-display text-sm font-medium text-accent-ink transition-colors duration-(--dur-micro) hover:bg-accent-2 active:translate-y-px"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
