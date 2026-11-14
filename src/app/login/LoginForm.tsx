"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

const fieldClass =
  "mt-2 h-10 w-full rounded-pill border border-muted bg-sheet px-3 font-body text-md text-ink outline-2 -outline-offset-3 outline-transparent transition-colors duration-(--dur-micro) hover:border-ink-2 focus-visible:outline-focus aria-invalid:border-error";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const invalid = state.error ? true : undefined;

  return (
    <form
      action={(formData) => {
        formData.set("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone);
        return formAction(formData);
      }}
      className="mt-8 flex flex-col gap-4"
    >
      <div>
        <label htmlFor="email" className="font-body text-sm font-medium text-muted">
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
        <label htmlFor="password" className="font-body text-sm font-medium text-muted">
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
      <p id="login-status" aria-live="polite" className="min-h-[1lh] font-body text-sm text-error">
        {state.error}
      </p>
      <button
        type="submit"
        disabled={pending}
        className="h-10 self-start rounded-pill bg-accent px-6 font-display text-sm font-medium text-accent-ink transition-colors duration-(--dur-micro) hover:bg-accent-2 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
