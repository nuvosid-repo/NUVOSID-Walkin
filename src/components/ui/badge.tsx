import { clsx } from "clsx";
import type { ReactNode } from "react";

type Tone = "neutral" | "gold" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  neutral: "border-line-strong bg-raised text-soft",
  gold: "border-gold/40 bg-gold/10 text-gold-light",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  danger: "border-danger/30 bg-danger/10 text-danger",
};

export function Badge({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span className={clsx("inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}
