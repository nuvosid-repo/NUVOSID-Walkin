"use client";

import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { revealPasscodeAction } from "@/actions/users";
import { CopyButton } from "@/components/ui/copy-button";

type Revealed = { status: "hidden" } | { status: "shown"; passcode: string } | { status: "unavailable" };

export function PasscodeCell({ userId, userName }: { userId: string; userName: string }) {
  const [revealed, setRevealed] = useState<Revealed>({ status: "hidden" });
  const [pending, startTransition] = useTransition();

  if (revealed.status === "unavailable") {
    return <span className="text-xs text-warning">Not saved. Use Edit to set a new one.</span>;
  }

  const shown = revealed.status === "shown";

  function toggle() {
    if (shown) {
      setRevealed({ status: "hidden" });
      return;
    }
    startTransition(async () => {
      const { passcode } = await revealPasscodeAction(userId);
      setRevealed(passcode ? { status: "shown", passcode } : { status: "unavailable" });
    });
  }

  return (
    <div className="flex items-center gap-1">
      <span className="min-w-[6.5rem] font-mono text-[13px] tracking-wide text-ink">
        {shown ? revealed.passcode : "••••••••"}
      </span>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-label={`${shown ? "Hide" : "Show"} passcode for ${userName}`}
        title={shown ? "Hide" : "Show"}
        className="grid size-8 cursor-pointer place-items-center rounded-lg text-muted transition-colors hover:bg-raised hover:text-ink"
      >
        {pending ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden /> : shown ? <EyeOff className="size-3.5" aria-hidden /> : <Eye className="size-3.5" aria-hidden />}
      </button>
      {shown && <CopyButton text={revealed.passcode} variant="ghost" />}
    </div>
  );
}
