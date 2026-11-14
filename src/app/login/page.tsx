import { BookOpen } from "lucide-react";
import { LoginDemo } from "./LoginDemo";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in · Read Later" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center py-8">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 lg:grid-cols-2 lg:items-center">
        <div className="mx-auto flex w-full max-w-md flex-col gap-10 lg:mx-0 lg:justify-self-center">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-control bg-accent text-accent-ink">
              <BookOpen aria-hidden="true" className="size-5" />
            </span>
            <span className="font-display text-lg font-semibold text-ink">Read Later</span>
          </div>
          <div>
            <h1 className="text-3xl">Sign in</h1>
            <p className="mt-3 text-md text-ink-2">Your reading list, one week at a time.</p>
          </div>
          <LoginForm />
        </div>
        <LoginDemo />
      </div>
    </main>
  );
}
