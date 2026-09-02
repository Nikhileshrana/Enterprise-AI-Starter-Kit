"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PLATFORM_NAV_ITEMS } from "@/components/nav-items";
import { NavUser } from "@/components/nav-user";
import type { NavUserData } from "@/lib/types";
import { OrganizationSwitcher } from "@/components/organization-switcher";
import { cn } from "@/lib/utils";

/** Mobile top bar: org logo left, profile right. */
export function MobileTopBar({ user }: { user: NavUserData }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-3 md:hidden">
      <OrganizationSwitcher variant="logo" />
      <NavUser user={user} variant="header" />
    </header>
  );
}

/** Mobile bottom tab bar for the same platform routes as the sidebar. */
export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto flex h-14 max-w-lg items-stretch justify-around px-2">
        {PLATFORM_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.url || pathname.startsWith(`${item.url}/`);

          return (
            <li key={item.url} className="flex min-w-0 flex-1">
              <Link
                href={item.url}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-5 shrink-0",
                    active && "text-foreground",
                  )}
                  aria-hidden
                />
                <span className="truncate">{item.title}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
