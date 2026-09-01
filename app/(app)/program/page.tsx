import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MacrocycleForm } from "@/components/program/macrocycle-form";
import { MesocycleForm } from "@/components/program/mesocycle-form";
import { ActivateMesocycleButton } from "@/components/program/activate-mesocycle-button";

const PHASE_LABELS: Record<string, string> = {
  acumulacion: "Acumulación",
  intensificacion: "Intensificación",
  deload: "Deload",
  realizacion: "Realización",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  active: "default",
  planned: "outline",
  completed: "secondary",
};

export default async function ProgramPage() {
  const supabase = await createClient();
  const { data: macrocycles } = await supabase
    .from("macrocycles")
    .select("*, mesocycles(*, microcycles(*))")
    .order("start_date", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Mission Control
          </p>
          <h1 className="font-heading text-xl font-bold">Macrociclo</h1>
          <p className="text-sm text-muted-foreground">Macrociclos, mesociclos y su fase actual.</p>
        </div>
        <MacrocycleForm />
      </div>

      {(macrocycles ?? []).length === 0 && (
        <p className="text-sm text-muted-foreground">
          Todavía no creaste ningún macrociclo. Es el primer paso para que el motor de IA pueda
          proponer periodización.
        </p>
      )}

      {(macrocycles ?? []).map((macro) => {
        const mesocycles = [...(macro.mesocycles ?? [])].sort((a, b) => a.order_index - b.order_index);
        return (
          <Card key={macro.id}>
            <CardHeader>
              <CardTitle>{macro.name}</CardTitle>
              {macro.goal && <CardDescription>{macro.goal}</CardDescription>}
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {mesocycles.length === 0 && (
                <p className="text-sm text-muted-foreground">Sin mesociclos todavía.</p>
              )}
              {mesocycles.map((meso, i) => {
                const activeMicro = (meso.microcycles ?? []).find((m) => m.status === "active");
                const weekNumber = activeMicro?.week_number ?? 0;
                const progressPct = Math.min(100, (weekNumber / meso.planned_weeks) * 100);
                const isActive = meso.status === "active";
                return (
                  <div key={meso.id}>
                    {i > 0 && <Separator className="my-3" />}
                    <div
                      className={cn(
                        "flex flex-col gap-2 rounded-lg p-3",
                        isActive && "bg-accent/40 ring-1 ring-primary/30",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-widest text-secondary">
                            {PHASE_LABELS[meso.phase] ?? meso.phase}
                            {activeMicro?.is_deload && " · Descarga"}
                          </p>
                          <p className="text-sm font-medium">{meso.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={STATUS_VARIANT[meso.status] ?? "outline"}>{meso.status}</Badge>
                          {meso.status === "planned" && <ActivateMesocycleButton mesocycleId={meso.id} />}
                        </div>
                      </div>
                      {isActive && (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                            <span>Semana {weekNumber} / {meso.planned_weeks}</span>
                            <span>{Math.round(progressPct)}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${Math.max(4, progressPct)}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {!isActive && (
                        <p className="font-mono text-xs text-muted-foreground">
                          {meso.planned_weeks} semanas planificadas
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              <div className="flex justify-end pt-1">
                <MesocycleForm macrocycleId={macro.id} nextOrderIndex={mesocycles.length} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
