import { clsx } from "clsx";

/**
 * The only place the brand mark is drawn. To use the real logo, put the file in
 * /public and return <Image src="/logo.png" ... /> here; every screen picks it up.
 */
export function Logo({ size = "md", label }: { size?: "sm" | "md" | "lg"; label?: string }) {
  return (
    <span className="inline-flex items-center gap-3">
      <span
        className={clsx(
          "font-semibold tracking-[0.22em] text-ink",
          size === "sm" && "text-sm",
          size === "md" && "text-base",
          size === "lg" && "text-xl",
        )}
      >
        NUVOSID
      </span>
      {label && (
        <span className="border-l border-line-strong pl-3 text-xs text-muted">{label}</span>
      )}
    </span>
  );
}
