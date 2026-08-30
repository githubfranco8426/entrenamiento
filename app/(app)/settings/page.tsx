import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { SettingsForm } from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("user_settings").select("*").maybeSingle();

  return (
    <Card className="max-w-lg">
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
  );
}
