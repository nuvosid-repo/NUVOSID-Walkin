import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function StatTile({ label, value, detail, href, icon: Icon }: { label: string; value: number; detail: string; href: string; icon: LucideIcon }) {
  return (
    <Link href={href} className="group rounded-xl border border-line bg-surface p-5 transition-colors hover:border-line-strong">
      <div className="flex items-center justify-between text-[13px] text-muted">
        {label}
        <Icon className="size-4 transition-colors group-hover:text-gold" aria-hidden />
      </div>
      <p className="mt-3 text-3xl font-semibold tabular-nums text-ink">{value}</p>
      <p className="mt-1 text-xs text-muted">{detail}</p>
    </Link>
  );
}
