"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

const MESSAGES = {
  saved: "Saved ✓",
  restored: "Saved ✓",
  already_saved: "Already saved this week",
} as const;

export function SaveForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const response = await fetch("/api/links", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url }),
        });
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        const isJson = response.headers.get("content-type")?.includes("application/json");
        const body = isJson ? await response.json() : null;
        if (!response.ok) {
          setMessage({ text: body?.error ?? "Something went wrong saving that link.", isError: true });
          return;
        }
        const text =
          body.result === "already_saved" && body.link.status === "done"
            ? "Already read this week (in Done)"
            : MESSAGES[body.result as keyof typeof MESSAGES];
        setMessage({ text, isError: false });
        setUrl("");
        router.refresh();
      } catch {
        setMessage({ text: "Network error, try again.", isError: true });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1">
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="url"
          autoComplete="off"
          aria-label="Link to save"
          placeholder="Paste a link"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-base dark:border-zinc-700"
        />
        <button
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
      <p
        aria-live="polite"
        className={`min-h-5 text-sm ${message?.isError ? "text-red-600 dark:text-red-400" : "text-zinc-600 dark:text-zinc-400"}`}
      >
        {message?.text}
      </p>
    </form>
  );
}
