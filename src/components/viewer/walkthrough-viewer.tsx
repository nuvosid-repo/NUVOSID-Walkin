"use client";

import { ArrowLeft, Info, LoaderCircle, Maximize, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { PropertyPanel, type PropertyDetails } from "./property-panel";

const noSubscribe = () => () => {};

type WalkthroughViewerProps = {
  src: string;
  backHref: string;
  backLabel: string;
  property: PropertyDetails;
  notice?: string;
};

export function WalkthroughViewer({ src, backHref, backLabel, property, notice }: WalkthroughViewerProps) {
  const frameBox = useRef<HTMLDivElement>(null);
  const [frameKey, setFrameKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const canFullscreen = useSyncExternalStore(noSubscribe, () => document.fullscreenEnabled, () => false);

  function restart() {
    setLoading(true);
    setFrameKey((key) => key + 1);
  }

  return (
    <div className="flex h-dvh flex-col bg-black">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-bg px-3 sm:gap-3 sm:px-4">
        <Link href={backHref} aria-label={backLabel} className="inline-flex h-9 items-center gap-2 rounded-lg px-2 text-[13px] text-soft transition-colors hover:bg-raised hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden />
          <span className="hidden sm:inline">{backLabel}</span>
        </Link>
        <div className="min-w-0 flex-1 border-l border-line pl-3">
          <h1 className="truncate text-sm font-semibold leading-tight">{property.name}</h1>
          <p className="truncate text-xs text-muted">{[property.configuration, property.city].filter(Boolean).join(" · ") || property.companyName}</p>
        </div>
        {notice && <span className="hidden text-xs text-warning md:inline">{notice}</span>}
        <Button variant="ghost" size="sm" onClick={() => setDetailsOpen((open) => !open)} aria-expanded={detailsOpen} aria-label="Property details">
          <Info className="size-4" aria-hidden /><span className="hidden sm:inline">Details</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={restart} aria-label="Restart walkthrough">
          <RotateCcw className="size-4" aria-hidden /><span className="hidden sm:inline">Restart</span>
        </Button>
        {canFullscreen && (
          <Button variant="ghost" size="sm" onClick={() => frameBox.current?.requestFullscreen()} aria-label="Fullscreen">
            <Maximize className="size-4" aria-hidden /><span className="hidden sm:inline">Fullscreen</span>
          </Button>
        )}
      </div>

      <div className="relative min-h-0 flex-1">
        <div ref={frameBox} className="absolute inset-0 bg-black">
          <iframe
            key={frameKey}
            src={src}
            title={`3D walkthrough of ${property.name}`}
            // Keeps uploaded code away from this portal: no allow-same-origin means no access to its cookies or APIs.
            sandbox="allow-scripts allow-pointer-lock allow-forms allow-modals"
            allow="autoplay; fullscreen; xr-spatial-tracking; accelerometer; gyroscope"
            onLoad={() => setLoading(false)}
            className="size-full border-0"
          />
        </div>
        {loading && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-bg text-sm text-muted">
            <span className="inline-flex items-center gap-2"><LoaderCircle className="size-4 animate-spin" aria-hidden /> Loading 3D walkthrough…</span>
          </div>
        )}
        {detailsOpen && <PropertyPanel property={property} onClose={() => setDetailsOpen(false)} />}
      </div>
    </div>
  );
}
