import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { SettingsForm } from "@/components/settings/settings-form";
import { CoachRequests } from "@/components/coach/coach-requests";

export default async function SettingsPage() {
  const supabase = await createClient();
  const [{ data: settings }, { data: pendingCoachLinks }] = await Promise.all([
    supabase.from("user_settings").select("*").maybeSingle(),
    supabase.from("coach_athlete_links").select("id, coach_email").eq("status", "pending"),
  ]);

  return (
    <div className="flex max-w-lg flex-col gap-6">
      {pendingCoachLinks && pendingCoachLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Solicitudes de coach</CardTitle>
          </CardHeader>
          <CardContent>
            <CoachRequests links={pendingCoachLinks} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Ajustes</CardTitle>
          <CardDescription>
            La fecha ancla del turno se usa para calcular automáticamente en qué día del ciclo 4x4
            estás cada día.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm initial={settings ?? null} />
        </CardContent>
      </Card>
    </div>
  );
}
