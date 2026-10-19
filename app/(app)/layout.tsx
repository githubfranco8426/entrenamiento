import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/app-nav";
import { AppMobileNav } from "@/components/app-mobile-nav";
import { RestTimerProvider } from "@/components/workouts/rest-timer-context";
import { TrainingDock } from "@/components/workouts/training-dock";
import { ActiveWorkoutProvider } from "@/components/workouts/active-workout-context";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <ActiveWorkoutProvider userId={user?.id ?? ""} key={user?.id}>
      <RestTimerProvider userId={user?.id ?? ""}>
        <div className="flex min-h-full flex-1">
          <AppNav email={user?.email ?? null} />
          <main className="mx-auto min-w-0 w-full max-w-6xl flex-1 px-4 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-[calc(12rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:py-9 lg:pb-10">{children}</main>
          <AppMobileNav />
        </div>
        <TrainingDock />
      </RestTimerProvider>
    </ActiveWorkoutProvider>
  );
}
