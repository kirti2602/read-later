"use client";

import { Link2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { isTypingTarget } from "@/shell/keyboard";

const MESSAGES = {
  saved: "Saved ✓",
  restored: "Saved ✓",
  already_saved: "Already in this week's list.",
} as const;

// Most previews land in about a second; a slow one takes up to two 5s attempts (src/links/metadata.ts).
const PREVIEW_RECHECK_MS = [1500, 4000, 8000, 13000];
// Pasted text only saves when it plainly is a link; anything else is left alone.
const LOOKS_LIKE_LINK = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i;

type Message = { text: string; isError: boolean };

export function SaveForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState<Message | null>(null);
  const [pending, startTransition] = useTransition();
  const saveRef = useRef<(link: string, pasted?: boolean) => void>(() => {});

  function fail(text: string) {
    setMessage({ text, isError: true });
    inputRef.current?.focus();
  }

  function save(link: string, pasted = false) {
    setMessage(null);
    if (link.trim() === "") {
      fail("Paste a link first.");
      return;
    }
    startTransition(async () => {
      try {
        const response = await fetch("/api/links", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url: link }),
        });
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        const isJson = response.headers.get("content-type")?.includes("application/json");
        const body = isJson ? await response.json() : null;
        if (!response.ok) {
          setUrl(link);
          fail(body?.error ?? "Couldn't save that link. Try again.");
          return;
        }
        const text =
          body.result === "already_saved" && body.link.status === "done"
            ? "Already read this week. It's under Done."
            : MESSAGES[body.result as keyof typeof MESSAGES];
        setMessage({ text: pasted ? `${text} Pasted from your clipboard.` : text, isError: false });
        setUrl("");
        if (!pasted) inputRef.current?.focus();
        router.refresh();
        if (body.previewPending) {
          PREVIEW_RECHECK_MS.forEach((ms) => setTimeout(() => router.refresh(), ms));
        }
      } catch {
        setUrl(link);
        fail("Couldn't reach the server. Check your connection and try again.");
      }
    });
  }
  // The paste listener is registered once; it calls the latest save through this ref.
  useEffect(() => {
    saveRef.current = save;
  });

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      if (isTypingTarget(event.target) || document.querySelector("dialog[open]")) return;
      const text = event.clipboardData?.getData("text")?.trim() ?? "";
      if (!LOOKS_LIKE_LINK.test(text)) return;
      event.preventDefault();
      saveRef.current(text, true);
    }
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save(url);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor="save-url" className="visually-hidden">
        Save a link
      </label>
      <div className="flex gap-3">
        <div className="relative min-w-0 flex-1">
          <Link2 aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-muted" />
          <input
            ref={inputRef}
            id="save-url"
            name="url"
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="Paste a link"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (message) setMessage(null);
            }}
            aria-invalid={message?.isError || undefined}
            aria-describedby="save-url-status"
            className="h-12 w-full rounded-input border border-muted bg-card pr-4 pl-11 text-md text-ink outline-2 -outline-offset-3 outline-transparent transition-colors duration-(--dur-micro) placeholder:text-muted hover:border-ink-2 focus-visible:outline-focus aria-invalid:border-error"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="stock h-12 min-w-24 shrink-0 rounded-stock bg-accent px-6 font-display text-md font-semibold text-accent-ink [--stock-edge:var(--color-accent-deep)] disabled:cursor-not-allowed disabled:opacity-55"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
      <p
        id="save-url-status"
        aria-live="polite"
        className={`mt-2 min-h-[1lh] px-1 text-sm ${message?.isError ? "text-error" : "text-muted"}`}
      >
        {message?.text ?? <span className="hidden lg:inline">Tip: press ⌘V anywhere on the page to save the link on your clipboard.</span>}
      </p>
    </form>
  );
}
