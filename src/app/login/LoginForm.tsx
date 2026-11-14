"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form
      action={(formData) => {
        formData.set("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone);
        return formAction(formData);
      }}
      className="flex flex-col gap-3"
    >
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-base dark:border-zinc-700"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-base dark:border-zinc-700"
        />
      </label>
      <p aria-live="polite" className="min-h-5 text-sm text-red-600 dark:text-red-400">
        {state.error}
      </p>
      <button
        disabled={pending}
        className="rounded-md bg-zinc-900 px-3 py-2 font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
