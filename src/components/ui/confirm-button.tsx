"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Button } from "./button";
import { Dialog } from "./dialog";

type ConfirmButtonProps = {
  children: ReactNode;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  variant?: "secondary" | "ghost" | "danger";
  /** Set when the trigger is quiet but the action is destructive */
  confirmVariant?: "secondary" | "danger";
  size?: "sm" | "md";
  ariaLabel?: string;
};

export function ConfirmButton({ children, title, description, confirmLabel, onConfirm, variant = "danger", confirmVariant, size = "sm", ariaLabel }: ConfirmButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button variant={variant} size={size} aria-label={ariaLabel} title={ariaLabel} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={title} description={description}>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant={confirmVariant ?? (variant === "danger" ? "danger" : "secondary")}
            pending={pending}
            onClick={() =>
              startTransition(async () => {
                await onConfirm();
                setOpen(false);
              })
            }
          >
            {confirmLabel}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
