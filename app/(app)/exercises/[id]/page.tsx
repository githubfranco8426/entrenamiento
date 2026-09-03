import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, PlayCircleIcon, ActivityIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExerciseThumbnail } from "@/components/exercises/exercise-thumbnail";
import { ExerciseBiomechanicsForm } from "@/components/exercises/exercise-biomechanics-form";

export default async function ExerciseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: exercise, error } = await supabase.from("exercises").select("*").eq("id", id).single();
  if (error || !exercise) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/exercises"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Ejercicios
      </Link>

      <div className="flex items-center gap-4">
        <ExerciseThumbnail src={exercise.thumbnail_url} alt={exercise.name} className="size-16 rounded-xl" />
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-xl font-bold">{exercise.name}</h1>
          <div className="flex flex-wrap items-center gap-1.5">
            {exercise.muscle_group && <Badge variant="outline">{exercise.muscle_group}</Badge>}
            {exercise.equipment && <Badge variant="outline">{exercise.equipment}</Badge>}
            {exercise.video_url && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 gap-1 px-1.5 text-secondary"
                render={<a href={exercise.video_url} target="_blank" rel="noreferrer" />}
              >
                <PlayCircleIcon className="size-3.5" />
                Ver ejecución
              </Button>
            )}
          </div>
        </div>
      </div>

      {(exercise.cues?.length || exercise.biomechanics_notes) && (
        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <ActivityIcon className="size-4 text-secondary" />
            <CardTitle>Análisis biomecánico</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {exercise.cues && exercise.cues.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Puntos clave de ejecución
                </p>
                <ul className="flex flex-col gap-1">
                  {exercise.cues.map((cue, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                      {cue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {exercise.biomechanics_notes && (
              <div className="flex flex-col gap-1.5">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Notas biomecánicas
                </p>
                <p className="whitespace-pre-wrap text-sm">{exercise.biomechanics_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Editar detalle biomecánico</CardTitle>
        </CardHeader>
        <CardContent>
          <ExerciseBiomechanicsForm
            exerciseId={exercise.id}
            initialCues={exercise.cues}
            initialNotes={exercise.biomechanics_notes}
          />
        </CardContent>
      </Card>
    </div>
  );
}
