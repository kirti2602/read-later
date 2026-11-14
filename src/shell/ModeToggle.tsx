"use client";

import { useSyncExternalStore } from "react";

type Mode = "auto" | "light" | "dark";

const NEXT: Record<Mode, Mode> = { auto: "light", light: "dark", dark: "auto" };
const LABEL: Record<Mode, string> = { auto: "Auto", light: "Light", dark: "Dark" };
const MODE_EVENT = "modechange";

function readMode(): Mode {
  const mode = document.documentElement.dataset.mode;
  return mode === "light" || mode === "dark" ? mode : "auto";
}

function subscribe(onChange: () => void) {
  window.addEventListener(MODE_EVENT, onChange);
  return () => window.removeEventListener(MODE_EVENT, onChange);
}

/** Cycles Auto (follows the system) → Light → Dark; the choice persists in localStorage. */
export function ModeToggle() {
  const mode = useSyncExternalStore(subscribe, readMode, () => "auto" as Mode);

  function cycle() {
    const next = NEXT[mode];
    try {
      if (next === "auto") localStorage.removeItem("mode");
      else localStorage.setItem("mode", next);
    } catch {
      // Storage can be blocked; the mode still applies for this visit.
    }
    if (next === "auto") delete document.documentElement.dataset.mode;
    else document.documentElement.dataset.mode = next;
    window.dispatchEvent(new Event(MODE_EVENT));
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Theme: ${LABEL[mode]}, change theme`}
      className="hit h-8 rounded-pill px-2 font-display text-sm font-medium text-muted transition-colors duration-(--dur-micro) hover:text-ink active:translate-y-px"
    >
      Theme: {LABEL[mode]}
    </button>
  );
}
