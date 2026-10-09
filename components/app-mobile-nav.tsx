"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontalIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/components/nav-links";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const PRIMARY_PATHS = ["/dashboard", "/calendar", "/routines", "/data"];
const primaryLinks = NAV_LINKS.filter((link) => PRIMARY_PATHS.includes(link.href));
const moreLinks = NAV_LINKS.filter((link) => !PRIMARY_PATHS.includes(link.href));
const itemClass = "flex min-w-0 min-h-14 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium text-sidebar-foreground/70 transition-colors";

export function AppMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const moreActive = moreLinks.some((link) => pathname.startsWith(link.href));

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-sidebar-border bg-sidebar/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden" aria-label="Navegación principal">
        {primaryLinks.map((link) => {
          const Icon = link.icon;
          const active = pathname.startsWith(link.href);
          return (
            <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined} className={cn(itemClass, active && "text-sidebar-primary")}>
              <Icon className="size-5 shrink-0" />
              <span className="truncate max-w-full">{link.label}</span>
            </Link>
          );
        })}
        <button type="button" className={cn(itemClass, moreActive && "text-sidebar-primary")} aria-label="Más secciones" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
          <MoreHorizontalIcon className="size-5" /><span>Más</span>
        </button>
      </nav>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[80dvh] overflow-y-auto sm:max-w-sm" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Más secciones</DialogTitle></DialogHeader>
          <div className="grid gap-2">
            {moreLinks.map((link) => {
              const Icon = link.icon;
              const active = pathname.startsWith(link.href);
              return (
                <Link key={link.href} href={link.href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined} className={cn("flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm hover:bg-accent", active && "bg-primary/10 text-primary")}>
                  <Icon className="size-5" />{link.label}
                </Link>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
