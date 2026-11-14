"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";

const MESSAGES = {
  saved: "Saved ✓",
  restored: "Saved ✓",
  already_saved: "Already in this week's list.",
} as const;

// Most previews land in about a second; a slow one takes up to two 5s attempts (src/links/metadata.ts).
const PREVIEW_RECHECK_MS = [1500, 4000, 8000, 13000];

type Message = { text: string; isError: boolean };

export function SaveForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState<Message | null>(null);
  const [pending, startTransition] = useTransition();

  function fail(text: string) {
    setMessage({ text, isError: true });
    inputRef.current?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (url.trim() === "") {
      fail("Paste a link first.");
      return;
    }
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
          fail(body?.error ?? "Couldn't save that link. Try again.");
          return;
        }
        const text =
          body.result === "already_saved" && body.link.status === "done"
            ? "Already read this week. It's under Done."
            : MESSAGES[body.result as keyof typeof MESSAGES];
        setMessage({ text, isError: false });
        setUrl("");
        // Keep the field ready for the next link.
        inputRef.current?.focus();
        router.refresh();
        if (body.previewPending) {
          PREVIEW_RECHECK_MS.forEach((ms) => setTimeout(() => router.refresh(), ms));
        }
      } catch {
        fail("Couldn't reach the server. Check your connection and try again.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor="save-url" className="font-body text-sm font-medium text-muted">
        Save a link
      </label>
      <div className="mt-2 flex gap-2">
        <input
          ref={inputRef}
          id="save-url"
          name="url"
          type="url"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="https://…"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (message) setMessage(null);
          }}
          aria-invalid={message?.isError || undefined}
          aria-describedby="save-url-status"
          className="h-10 min-w-0 flex-1 rounded-pill border border-muted bg-sheet px-3 font-body text-md text-ink outline-2 -outline-offset-3 outline-transparent transition-colors duration-(--dur-micro) placeholder:text-muted hover:border-ink-2 focus-visible:outline-focus aria-invalid:border-error"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-10 min-w-24 shrink-0 rounded-pill bg-accent px-6 font-display text-sm font-medium text-accent-ink transition-colors duration-(--dur-micro) hover:bg-accent-2 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
      <p
        id="save-url-status"
        aria-live="polite"
        className={`mt-2 min-h-[1lh] font-body text-sm ${message?.isError ? "text-error" : "text-muted"}`}
      >
        {message?.text}
      </p>
    </form>
  );
}
