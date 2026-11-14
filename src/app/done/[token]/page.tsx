import NextLink from "next/link";
import { Suspense } from "react";
import { verifyDoneToken } from "@/digest/token";
import { doneSecret } from "@/digest/config";
import { DoneConfirm } from "./DoneConfirm";

export const metadata = { title: "Done · Read Later", robots: { index: false } };

/** Landing page for an email Done link. Works signed out; the token is the permission. */
export default function DonePage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-card bg-card px-8 py-10 text-center shadow-(--shadow-card)">
        <Suspense fallback={<p className="text-md text-muted">Checking the link…</p>}>
          <DoneBody params={params} />
        </Suspense>
        <NextLink href="/" className="text-sm font-semibold text-link no-underline hover:underline">
          Open Read Later
        </NextLink>
      </div>
    </main>
  );
}

async function DoneBody({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!verifyDoneToken(token, doneSecret())) {
    return (
      <div role="alert">
        <p className="text-lg font-semibold text-ink">This Done link has expired or isn&apos;t valid</p>
        <p className="mt-1 text-md text-muted">Open the app to mark it done there.</p>
      </div>
    );
  }
  return <DoneConfirm token={token} />;
}
