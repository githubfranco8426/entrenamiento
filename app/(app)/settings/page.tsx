import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/supabase/get-authenticated-user";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { SettingsForm } from "@/components/settings/settings-form";
import { CoachRequests } from "@/components/coach/coach-requests";
import { NutritionPlanCard } from "@/components/settings/nutrition-plan-card";

export default async function SettingsPage() {
  const supabase = await createClient();
  const [{ data: settings }, { data: pendingCoachLinks }, user, { data: latestWeight }] = await Promise.all([
    supabase.from("user_settings").select("*").maybeSingle(),
    supabase.from("coach_athlete_links").select("id, coach_email").eq("status", "pending"),
    getAuthenticatedUser(supabase),
    supabase
      .from("body_metrics")
      .select("weight_kg")
      .not("weight_kg", "is", null)
      .order("log_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  let nutritionPlanUrl: string | null = null;
  if (user) {
    const admin = createAdminClient();
    const { data: signed } = await admin.storage
      .from("documents")
      .createSignedUrl(`${user.id}/plan-nutricional.pdf`, 60 * 10);
    nutritionPlanUrl = signed?.signedUrl ?? null;
  }

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <Card>
        <CardContent className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-border bg-muted font-heading text-lg font-semibold text-primary">
            {(user?.email ?? "?").slice(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-base font-semibold">{user?.email ?? "Atleta"}</span>
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              {settings?.experience_years != null
                ? `${settings.experience_years} años de experiencia`
                : "Perfil de entrenamiento"}
              {latestWeight?.weight_kg != null ? ` · ${latestWeight.weight_kg} kg` : ""}
            </span>
          </div>
        </CardContent>
      </Card>

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
          <CardTitle>Nutrición</CardTitle>
        </CardHeader>
        <CardContent>
          <NutritionPlanCard url={nutritionPlanUrl} />
        </CardContent>
      </Card>

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
