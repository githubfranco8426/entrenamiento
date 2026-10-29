import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/app-nav";
import { AppHeader } from "@/components/app-header";
import { AppMobileNav } from "@/components/app-mobile-nav";
import { RestTimerProvider } from "@/components/workouts/rest-timer-context";
import { RestTimerWidget } from "@/components/workouts/rest-timer-widget";
import { ActiveWorkoutProvider } from "@/components/workouts/active-workout-context";
import { ActiveSetWidget } from "@/components/workouts/active-set-widget";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <ActiveWorkoutProvider>
      <RestTimerProvider>
        <div className="flex min-h-full flex-1">
          <AppNav email={user?.email ?? null} />
          <div className="min-w-0 flex-1">
            <AppHeader />
            <main className="mx-auto w-full min-w-0 max-w-6xl px-4 pt-5 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:py-9 lg:pb-10">{children}</main>
          </div>
          <AppMobileNav />
        </div>
        <RestTimerWidget />
        <ActiveSetWidget />
      </RestTimerProvider>
    </ActiveWorkoutProvider>
  );
}
