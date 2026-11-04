"use client";

import { clsx } from "clsx";
import { Building2, FolderKanban, LayoutDashboard, LogOut, Menu, Settings, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { adminLogoutAction } from "@/actions/auth";
import { Logo } from "@/components/brand/logo";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/companies", label: "Companies", icon: Building2 },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ adminName, children }: { adminName: string; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-dvh lg:pl-60">
      <div className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-bg/95 px-4 backdrop-blur lg:hidden">
        <Logo size="sm" label="Admin" />
        <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="grid size-9 cursor-pointer place-items-center rounded-lg text-soft hover:bg-raised">
          <Menu className="size-5" aria-hidden />
        </button>
      </div>

      {open && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-line bg-surface transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Logo size="sm" label="Admin" />
          <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="grid size-8 cursor-pointer place-items-center rounded-lg text-muted hover:bg-raised lg:hidden">
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-2">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
                  active ? "bg-raised font-medium text-ink" : "text-muted hover:bg-raised/60 hover:text-ink",
                )}
              >
                <Icon className={clsx("size-4", active && "text-gold")} aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-between gap-2 border-t border-line px-5 py-3">
          <span className="truncate text-[13px] text-soft">{adminName}</span>
          <form action={adminLogoutAction}>
            <button type="submit" aria-label="Sign out" title="Sign out" className="grid size-8 cursor-pointer place-items-center rounded-lg text-muted hover:bg-raised hover:text-ink">
              <LogOut className="size-4" aria-hidden />
            </button>
          </form>
        </div>
      </aside>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">{children}</main>
    </div>
  );
}
