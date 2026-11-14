import { AppHeader } from "@/shell/AppHeader";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in · Read Later" };

export default function LoginPage() {
  return (
    <>
      <AppHeader signedIn={false} />
      <main className="mx-auto max-w-(--container-app) px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-md border-t-2 border-ink bg-sheet px-4 pt-6 pb-6 sm:px-10 sm:pt-10 sm:pb-10">
          <h1 className="text-xl sm:text-2xl">Sign in</h1>
          <p className="mt-2 font-body text-md text-ink-2">Your reading list, one week at a time.</p>
          <LoginForm />
        </div>
      </main>
    </>
  );
}
