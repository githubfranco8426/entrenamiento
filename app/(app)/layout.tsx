import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/app-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-full flex-1">
      <AppNav email={user?.email ?? null} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
    </div>
  );
}
