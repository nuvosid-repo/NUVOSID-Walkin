"use client";

import { useSyncExternalStore } from "react";
import { CopyButton } from "@/components/ui/copy-button";
import { Dialog } from "@/components/ui/dialog";
import type { ActionState } from "@/lib/form";

type Credentials = NonNullable<ActionState["credentials"]>;

const subscribe = () => () => {};

export function CredentialsDialog({ credentials, onClose, title }: { credentials: Credentials | null; onClose: () => void; title: string }) {
  const origin = useSyncExternalStore(subscribe, () => window.location.origin, () => "");
  const loginUrl = `${origin}/login`;
  const message = credentials
    ? `Hello ${credentials.name},\n\nYour NUVOSID project portal login:\n\nPortal: ${loginUrl}\nUser ID: ${credentials.username}\nPasscode: ${credentials.passcode}\n\nPlease keep these details private.`
    : "";

  return (
    <Dialog
      open={!!credentials}
      onClose={onClose}
      title={title}
      description="Share these with the user. You can view them again any time in the Users table."
    >
      {credentials && (
        <>
          <dl className="divide-y divide-line rounded-lg border border-line bg-bg text-sm">
            <Row label="Company" value={credentials.company} />
            <Row label="Portal" value={loginUrl} />
            <Row label="User ID" value={credentials.username} copy />
            <Row label="Passcode" value={credentials.passcode} copy strong />
          </dl>
          <CopyButton text={message} label="Copy login message" variant="primary" className="mt-4 h-10 w-full" />
        </>
      )}
    </Dialog>
  );
}

function Row({ label, value, copy, strong }: { label: string; value: string; copy?: boolean; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
      <div className="min-w-0">
        <dt className="text-xs text-muted">{label}</dt>
        <dd className={strong ? "mt-0.5 font-mono text-[15px] font-semibold tracking-wider text-gold-light" : "mt-0.5 truncate text-ink"}>{value}</dd>
      </div>
      {copy && <CopyButton text={value} variant="ghost" />}
    </div>
  );
}
