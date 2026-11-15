"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

const fieldClass =
  "mt-2 h-12 w-full rounded-input border border-muted bg-card px-4 text-md text-ink outline-2 -outline-offset-3 outline-transparent transition-colors duration-(--dur-micro) hover:border-ink-2 focus-visible:outline-focus aria-invalid:border-error";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const invalid = state.error ? true : undefined;

  return (
    <form
      action={(formData) => {
        formData.set("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone);
        // Read at submit rather than render so the static login page needs no search-param boundary.
        formData.set("next", new URLSearchParams(window.location.search).get("next") ?? "");
        return formAction(formData);
      }}
      className="flex flex-col gap-4 rounded-card bg-card p-6 shadow-[var(--shadow-card)] sm:p-8"
    >
      <div>
        <label htmlFor="email" className="font-display text-sm font-medium text-muted">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={invalid}
          aria-describedby="login-status"
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="password" className="font-display text-sm font-medium text-muted">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={invalid}
          aria-describedby="login-status"
          className={fieldClass}
        />
      </div>
      <p id="login-status" aria-live="polite" className="min-h-[1lh] text-sm text-error">
        {state.error}
      </p>
      <button
        type="submit"
        disabled={pending}
        className="stock h-12 w-full rounded-stock bg-accent px-6 font-display text-md font-semibold text-accent-ink [--stock-edge:var(--color-accent-deep)] disabled:cursor-not-allowed disabled:opacity-55"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
