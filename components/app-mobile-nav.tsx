"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/components/nav-links";

export function AppMobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex overflow-x-auto border-t border-sidebar-border bg-sidebar pb-[env(safe-area-inset-bottom)] sm:hidden"
      aria-label="Navegación principal"
    >
      {NAV_LINKS.map((link) => {
        const Icon = link.icon;
        const active = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex min-w-16 flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium text-sidebar-foreground/70 transition-colors",
              active && "text-sidebar-primary",
            )}
          >
            <Icon className={cn("size-5", active && "text-sidebar-primary")} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
