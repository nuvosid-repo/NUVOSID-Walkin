"use client";

import { Button } from "@/components/ui/button";

export default function Error({ retry }: { error: Error; retry: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <h1 className="font-display text-4xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-soft">Please try again. If it keeps happening, contact your NUVOSID project lead.</p>
        <Button variant="secondary" className="mt-6" onClick={() => retry()}>Try again</Button>
      </div>
    </main>
  );
}
