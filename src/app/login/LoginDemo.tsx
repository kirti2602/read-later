"use client";

import { Check, FileText, MessageCircle, Play, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

type Kind = "article" | "video" | "post";
type Step = 0 | 1 | 2 | 3 | 4 | 5;

const KINDS: Record<Kind, { label: string; Icon: LucideIcon; tint: string }> = {
  article: { label: "Article", Icon: FileText, tint: "bg-tint-article" },
  video: { label: "Video", Icon: Play, tint: "bg-tint-video" },
  post: { label: "Post", Icon: MessageCircle, tint: "bg-tint-post" },
};

// Each entry: the step to show, then how long to hold it. The sum is the loop length (~8s).
const TIMELINE: { step: Step; hold: number }[] = [
  { step: 0, hold: 800 }, // list at rest
  { step: 1, hold: 2000 }, // new card drops in, still loading
  { step: 2, hold: 1800 }, // its details resolve
  { step: 3, hold: 1200 }, // third card's Done is pressed, check pops
  { step: 4, hold: 1600 }, // that card fades away
  { step: 5, hold: 600 }, // new card fades out, ready to loop
];
const SETTLED: Step = 2;
const SLOT = 9; // rem between card tops; cards are 8rem tall

function Pill({ done, pressed }: { done: boolean; pressed: boolean }) {
  return (
    <span
      className={`inline-flex h-7 items-center gap-1 rounded-pill bg-mint px-3 font-display text-sm font-semibold text-mint-ink transition-[translate,box-shadow] duration-(--dur-micro) ease-(--ease-snap) ${
        pressed ? "translate-y-[3px] shadow-[0_0_0_0_var(--color-mint-deep)]" : "shadow-[0_3px_0_0_var(--color-mint-deep)]"
      }`}
    >
      <Check key={done ? "done" : "idle"} aria-hidden="true" strokeWidth={3} className={`size-4 ${done ? "animate-pop" : ""}`} />
      Done
    </span>
  );
}

function SampleCard({
  kind,
  title,
  slot,
  loading = false,
  pressed = false,
  done = false,
  hidden = false,
  enter = false,
}: {
  kind: Kind;
  title: string;
  slot: number;
  loading?: boolean;
  pressed?: boolean;
  done?: boolean;
  hidden?: boolean;
  enter?: boolean;
}) {
  const { label, Icon, tint } = KINDS[kind];
  return (
    <div
      style={{ translate: `0 ${slot * SLOT}rem` }}
      className={`absolute inset-x-0 top-0 h-32 transition-[translate,opacity] duration-(--dur-long) ease-(--ease-snap) ${
        hidden ? "opacity-0" : "opacity-100"
      } ${enter ? "animate-rise" : ""}`}
    >
      <div className="flex h-full gap-4 rounded-card bg-card p-3 shadow-[var(--shadow-card)]">
        {loading ? (
          <>
            <div className="shimmer size-22 shrink-0 rounded-stock" />
            <div className="flex flex-1 flex-col justify-center gap-3">
              <div className="shimmer h-5 w-20 rounded-pill" />
              <div className="shimmer h-4 w-full rounded-pill" />
              <div className="shimmer h-4 w-2/3 rounded-pill" />
            </div>
          </>
        ) : (
          <>
            <div className={`${tint} animate-rise grid size-22 shrink-0 place-items-center rounded-stock text-ink-2`}>
              <Icon aria-hidden="true" className="size-8" />
            </div>
            <div className="animate-rise flex min-w-0 flex-1 flex-col items-start justify-between py-1">
              <span className="inline-flex items-center gap-1 rounded-pill bg-paper-2 px-2 py-0.5 font-display text-xs font-medium text-ink-2">
                <Icon aria-hidden="true" className="size-3" />
                {label}
              </span>
              <p className="font-display text-md leading-tight font-semibold text-ink">{title}</p>
              <Pill done={done} pressed={pressed} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function LoginDemo() {
  const [step, setStep] = useState<Step>(SETTLED);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setTimeout> | undefined;
    let index = 0;

    const run = (i: number) => {
      index = i;
      setStep(TIMELINE[i].step);
      timer = setTimeout(() => run((i + 1) % TIMELINE.length), TIMELINE[i].hold);
    };
    const stop = () => clearTimeout(timer);
    const sync = () => {
      stop();
      if (reduced.matches) {
        setStep(SETTLED);
      } else if (!document.hidden) {
        timer = setTimeout(() => run(index), 0);
      }
    };

    sync();
    reduced.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      stop();
      reduced.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  const arrived = step >= 1 && step <= 5;
  const resolved = step >= 2;
  const offset = arrived ? 1 : 0;
  const lastDone = step >= 3 && step <= 4;

  return (
    <div aria-hidden="true" className="hidden rounded-card bg-paper-2 p-8 lg:block">
      <div className="relative mx-auto h-[26rem] max-w-sm">
        <SampleCard kind="video" title="That talk everyone shared" slot={0 + offset} />
        <SampleCard
          kind="post"
          title="A thread worth finishing"
          slot={1 + offset}
          pressed={step === 3}
          done={lastDone}
          hidden={step === 4 || step === 5}
        />
        {arrived && (
          <SampleCard
            key={resolved ? "resolved" : "loading"}
            kind="article"
            title="A long read you saved on Monday"
            slot={0}
            loading={!resolved}
            hidden={step === 5}
            enter={step === 1}
          />
        )}
      </div>
      <p className="mt-8 text-center font-display text-md font-medium text-ink-2">
        Save from anywhere. Read it on Saturday.
      </p>
    </div>
  );
}
