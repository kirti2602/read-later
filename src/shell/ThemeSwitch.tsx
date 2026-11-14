"use client";

import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useSyncExternalStore } from "react";

type Mode = "auto" | "light" | "dark";

const OPTIONS: { mode: Mode; label: string; Icon: LucideIcon }[] = [
  { mode: "light", label: "Light", Icon: Sun },
  { mode: "dark", label: "Dark", Icon: Moon },
  { mode: "auto", label: "Match system", Icon: Monitor },
];
const MODE_EVENT = "modechange";

function readMode(): Mode {
  const mode = document.documentElement.dataset.mode;
  return mode === "light" || mode === "dark" ? mode : "auto";
}

function subscribe(onChange: () => void) {
  window.addEventListener(MODE_EVENT, onChange);
  return () => window.removeEventListener(MODE_EVENT, onChange);
}

function applyMode(mode: Mode) {
  try {
    if (mode === "auto") localStorage.removeItem("mode");
    else localStorage.setItem("mode", mode);
  } catch {
    // Storage can be blocked; the mode still applies for this visit.
  }
  if (mode === "auto") delete document.documentElement.dataset.mode;
  else document.documentElement.dataset.mode = mode;
  window.dispatchEvent(new Event(MODE_EVENT));
}

/** Light / Dark / Match system; the choice persists in localStorage and applies before paint (layout.tsx). */
export function ThemeSwitch() {
  const mode = useSyncExternalStore(subscribe, readMode, () => "auto" as Mode);

  return (
    <div role="radiogroup" aria-label="Theme" className="inline-flex self-start rounded-pill bg-paper p-0.5 shadow-[inset_0_0_0_1px_var(--color-rule)]">
      {OPTIONS.map(({ mode: option, label, Icon }) => {
        const selected = option === mode;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            title={label}
            onClick={() => applyMode(option)}
            className={`hit grid h-8 w-9 place-items-center rounded-pill transition-colors duration-(--dur-micro) ${
              selected ? "bg-card text-ink shadow-(--shadow-card)" : "text-muted hover:text-ink"
            }`}
          >
            <Icon aria-hidden className="size-4" />
          </button>
        );
      })}
    </div>
  );
}
