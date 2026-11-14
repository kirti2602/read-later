import NextLink from "next/link";
import { signOut } from "@/app/login/actions";
import { ModeToggle } from "./ModeToggle";

export function AppHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex h-14 max-w-(--container-app) items-center justify-between px-4 sm:px-6">
        <NextLink
          href="/"
          aria-label="Read Later, home"
          className="font-display text-lg font-semibold tracking-(--tracking-display) text-ink no-underline"
        >
          Read Later
        </NextLink>
        <div className="flex items-center gap-2">
          <ModeToggle />
          {signedIn && (
            <form action={signOut}>
              <button
                type="submit"
                className="hit h-8 rounded-pill px-2 font-display text-sm font-medium text-muted transition-colors duration-(--dur-micro) hover:text-ink active:translate-y-px"
              >
                Sign out
              </button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
