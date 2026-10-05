import { createClient } from "@/lib/supabase/server";
import { getRoutineScope } from "@/lib/training/routine-scope";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { RoutineForm } from "@/components/routines/routine-form";
import { ExerciseThumbnail } from "@/components/exercises/exercise-thumbnail";
import { ExerciseNoteEditor } from "@/components/routines/exercise-note-editor";
import { DeleteButton } from "@/components/ui/delete-button";

export default async function RoutinesPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const { week } = await searchParams;
  const supabase = await createClient();
  const activeScope = await getRoutineScope(supabase);
  const { data: weeks } = await supabase.from("microcycles").select("id, week_number, start_date, end_date, status, is_deload, mesocycles!inner(status)").eq("mesocycles.status", "active").order("week_number");
  const selectedWeek = (weeks ?? []).find((w) => w.id === week);
  const routineScope = selectedWeek ? `microcycle_id.eq.${selectedWeek.id}` : activeScope;

  const [{ data: routines }, { data: exercises }] = await Promise.all([
    supabase
      .from("routines")
      .select("*, routine_exercises(*, exercises(name, thumbnail_url), target_sets(*))")
      .or(routineScope)
      .order("order_index"),
    supabase.from("exercises").select("id, name").order("name"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-lg font-semibold">Rutinas</h1>
          <p className="text-sm text-muted-foreground">Programa por semana. Las rutinas de casa sustituyen la sesión correspondiente.</p>
        </div>
        <RoutineForm exercises={exercises ?? []} />
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="Semanas del mesociclo">
        {(weeks ?? []).map((w) => <Link key={w.id} href={`/routines?week=${w.id}`} className="rounded-md border px-3 py-2 text-sm">Semana {w.week_number}{w.is_deload ? " · Descarga" : ""}{w.status === "active" ? " · Actual" : ""}</Link>)}
      </nav>
      {(routines ?? []).length === 0 && (
        <p className="text-sm text-muted-foreground">
          {(exercises ?? []).length === 0
            ? "Creá tu primera rutina con \"Nueva rutina\" — vas a poder agregar ejercicios sobre la marcha."
            : "Todavía no creaste ninguna rutina."}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {(routines ?? []).map((routine) => (
          <Card key={routine.id}>
            <CardHeader className="flex-row items-start justify-between gap-2">
              <div>
                <CardDescription className="font-mono text-[10px] uppercase tracking-widest text-secondary">
                  {routine.day_label ?? "Rutina"}
                </CardDescription>
                <CardTitle>{routine.title}</CardTitle>
              </div>
              <DeleteButton
                endpoint={`/api/routines/${routine.id}`}
                confirmMessage={`¿Borrar la rutina "${routine.title}"? Esta acción no se puede deshacer.`}
                successMessage="Rutina borrada"
              />
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
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 font-mono text-xs text-muted-foreground">{i + 1}.</span>
                        <ExerciseThumbnail
                          src={re.exercises?.thumbnail_url}
                          alt={re.exercises?.name ?? ""}
                          className="size-8"
                        />
                        <div>
                          <p className="text-sm font-medium">{re.exercises?.name}</p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {sets.length}x
                            {first?.target_reps_min && `${first.target_reps_min}-${first.target_reps_max ?? first.target_reps_min}`}
                            {first?.target_rpe && ` · RPE ${first.target_rpe}`}
                          </p>
                        </div>
                      </div>
                      <ExerciseNoteEditor routineExerciseId={re.id} initialNotes={re.notes} />
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
