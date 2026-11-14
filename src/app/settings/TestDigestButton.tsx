"use client";

import { Send } from "lucide-react";
import { useActionState } from "react";
import { sendTestDigest, type TestDigestState } from "@/digest/actions";

const initial: TestDigestState = { message: null, isError: false };

export function TestDigestButton() {
  const [state, action, pending] = useActionState(sendTestDigest, initial);
  return (
    <form action={action} className="flex flex-col items-start gap-2">
      <button
        type="submit"
        disabled={pending}
        className="stock flex h-11 items-center gap-2 rounded-stock bg-accent px-5 font-display text-md font-semibold text-accent-ink [--stock-edge:var(--color-accent-deep)] disabled:cursor-not-allowed disabled:opacity-55"
      >
        <Send aria-hidden className="size-4" />
        {pending ? "Sending…" : "Send test digest"}
      </button>
      <p aria-live="polite" className={`min-h-[1lh] text-sm ${state.isError ? "text-error" : "text-muted"}`}>
        {state.message}
      </p>
    </form>
  );
}
