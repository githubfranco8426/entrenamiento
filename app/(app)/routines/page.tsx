import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RoutineForm } from "@/components/routines/routine-form";

export default async function RoutinesPage() {
  const supabase = await createClient();

  const [{ data: routines }, { data: exercises }] = await Promise.all([
    supabase
      .from("routines")
      .select("*, routine_exercises(*, exercises(name), target_sets(*))")
      .order("order_index"),
    supabase.from("exercises").select("id, name").order("name"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-lg font-semibold">Rutinas</h1>
          <p className="text-sm text-muted-foreground">Plantillas de entrenamiento por día.</p>
        </div>
        <RoutineForm exercises={exercises ?? []} />
      </div>

      {(routines ?? []).length === 0 && (
        <p className="text-sm text-muted-foreground">
          {(exercises ?? []).length === 0
            ? "Primero agregá ejercicios en la sección Ejercicios, y después armá tu primera rutina."
            : "Todavía no creaste ninguna rutina."}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {(routines ?? []).map((routine) => (
          <Card key={routine.id}>
            <CardHeader>
              <CardTitle>{routine.title}</CardTitle>
              {routine.day_label && <CardDescription>{routine.day_label}</CardDescription>}
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {(routine.routine_exercises ?? [])
                .sort((a, b) => a.order_index - b.order_index)
                .map((re, i) => {
                  const sets = (re.target_sets ?? []).sort((a, b) => a.set_index - b.set_index);
                  const first = sets[0];
                  return (
                    <div key={re.id}>
                      {i > 0 && <Separator className="my-2" />}
                      <p className="text-sm font-medium">{re.exercises?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {sets.length} sets
                        {first?.target_reps_min && ` · ${first.target_reps_min}-${first.target_reps_max ?? first.target_reps_min} reps`}
                        {first?.target_rpe && ` · RPE ${first.target_rpe}`}
                      </p>
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
