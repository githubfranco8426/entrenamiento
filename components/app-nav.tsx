"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboardIcon,
  ClipboardListIcon,
  DumbbellIcon,
  CalendarRangeIcon,
  SparklesIcon,
  SettingsIcon,
  LogOutIcon,
} from "lucide-react";

const LINKS = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboardIcon },
  { href: "/routines", label: "Rutinas", icon: ClipboardListIcon },
  { href: "/exercises", label: "Ejercicios", icon: DumbbellIcon },
  { href: "/program", label: "Programa", icon: CalendarRangeIcon },
  { href: "/ai", label: "IA", icon: SparklesIcon },
  { href: "/settings", label: "Ajustes", icon: SettingsIcon },
];

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
    <aside className="flex w-60 shrink-0 flex-col gap-1 bg-sidebar px-3 py-5 text-sidebar-foreground">
      <div className="mb-4 flex items-center gap-2 px-2">
        <div className="flex size-8 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
          <DumbbellIcon className="size-4" />
        </div>
        <span className="font-heading text-sm font-semibold">Entrenamiento</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {LINKS.map((link) => {
          const Icon = link.icon;
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                active && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground",
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
