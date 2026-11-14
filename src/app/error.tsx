"use client";

export default function ErrorPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col items-start gap-3 px-4 py-12">
      <h1 className="text-xl font-semibold">Couldn&apos;t load your list</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        The server didn&apos;t respond. Your links are safe; try again in a moment.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        Try again
      </button>
    </main>
  );
}
