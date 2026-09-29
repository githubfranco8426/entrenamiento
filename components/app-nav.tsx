"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/components/nav-links";
import { LogOutIcon } from "lucide-react";
import { AppLogo } from "@/components/app-logo";

export function AppNav({ email }: { email: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-1 border-r border-sidebar-border/80 bg-sidebar/85 px-3 py-6 text-sidebar-foreground backdrop-blur-xl sm:flex">
      <div className="mb-7 flex items-center gap-3 px-2">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/25">
          <AppLogo className="size-7 shrink-0" />
        </div>
        <div className="flex flex-col">
          <span className="font-heading text-sm font-bold tracking-tight">Entrenamiento</span>
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-primary">Performance OS</span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_LINKS.map((link) => {
          const Icon = link.icon;
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground/75 transition-all hover:translate-x-0.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                active && "bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_8px_18px_-9px_#00f2fe] hover:bg-sidebar-primary hover:text-sidebar-primary-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-2 border-t border-sidebar-border pt-3">
        {email && <span className="truncate px-2 text-xs text-sidebar-foreground/60">{email}</span>}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="justify-start gap-2.5 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOutIcon className="size-4" /> Cerrar sesión
        </Button>
      </div>
    </aside>
  );
}
