import Link from "next/link";
import { UserRoundIcon } from "lucide-react";
import { AppLogo } from "@/components/app-logo";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur-md lg:hidden">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2.5" aria-label="Entrenamiento: inicio">
          <AppLogo className="size-9" />
          <div>
            <p className="font-heading text-sm font-bold uppercase tracking-tight">Entrenamiento</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <span className="size-1.5 rounded-full bg-emerald-600" />Tu plan, tu progreso
            </p>
          </div>
        </Link>
        <Link href="/settings" aria-label="Perfil y ajustes" className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          <UserRoundIcon className="size-4" />
        </Link>
      </div>
    </header>
  );
}
