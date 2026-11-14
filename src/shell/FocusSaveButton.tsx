"use client";

import { Plus } from "lucide-react";

/** The sidebar's primary action: jumps to the save field (the field itself owns saving). */
export function FocusSaveButton() {
  return (
    <button
      type="button"
      onClick={() => {
        const field = document.getElementById("save-url");
        field?.scrollIntoView({ block: "center", behavior: "smooth" });
        field?.focus({ preventScroll: true });
      }}
      className="stock flex h-11 w-full items-center justify-center gap-2 rounded-stock bg-accent px-4 font-display text-md font-semibold text-accent-ink [--stock-edge:var(--color-accent-deep)]"
    >
      <Plus aria-hidden className="size-4" strokeWidth={2.6} />
      Save a link
    </button>
  );
}
