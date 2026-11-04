import { LogOut } from "lucide-react";
import { clientLogoutAction } from "@/actions/auth";
import { Logo } from "@/components/brand/logo";

export function PortalHeader({ userName, companyName }: { userName: string; companyName: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-8">
        <Logo />
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-[13px] font-medium leading-tight">{userName}</p>
            <p className="text-xs text-muted">{companyName}</p>
          </div>
          <form action={clientLogoutAction}>
            <button type="submit" className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-line px-3 text-[13px] text-soft transition-colors hover:border-line-strong hover:text-ink">
              <LogOut className="size-3.5" aria-hidden /> Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
