import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <p className="text-sm text-muted">404</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">This page isn&apos;t available</h1>
        <p className="mt-2 text-soft">It may have been removed, or your account may not have access to it.</p>
        <Link href="/" className={`${buttonClass("secondary")} mt-6`}>Go to home</Link>
      </div>
    </main>
  );
}
