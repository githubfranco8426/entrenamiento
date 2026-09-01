"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExerciseThumbnail } from "@/components/exercises/exercise-thumbnail";
import { PlayCircleIcon } from "lucide-react";

interface ExerciseOption {
  id: string;
  name: string;
  plate_increment_kg: number;
  thumbnail_url: string | null;
  video_url: string | null;
}

interface TargetSet {
  id: string;
  set_index: number;
  set_type: string;
  target_reps_min: number | null;
  target_reps_max: number | null;
  target_rpe: number | null;
}

const LOG_INPUT_CLASS =
  "bg-foreground dark:bg-foreground text-background placeholder:text-background/50 border-transparent font-mono text-center";

const SET_TYPE_LABELS: Record<string, string> = {
  myo: "+ Myo-reps",
  dropset: "Dropset",
  failure: "Al fallo",
  warmup: "Calentamiento",
};

interface SetLog {
  id: string;
  set_index: number;
  weight_kg: number | null;
  reps: number | null;
  rpe_actual: number | null;
}

interface RoutineExercise {
  id: string;
  exercise_id: string;
  order_index: number;
  exercises: ExerciseOption | null;
  target_sets: TargetSet[];
}

interface WorkoutExercise {
  id: string;
  exercise_id: string;
  routine_exercise_id: string | null;
  exercises: ExerciseOption | null;
  set_logs: SetLog[];
}

interface WorkoutData {
  id: string;
  started_at: string;
  ended_at: string | null;
  routines: { title: string; day_label: string | null; routine_exercises: RoutineExercise[] } | null;
  workout_exercises: WorkoutExercise[];
}

interface Block {
  key: string;
  exerciseId: string;
  exerciseName: string;
  plateIncrementKg: number;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  routineExerciseId: string | null;
  targetSets: TargetSet[];
  loggedSets: SetLog[];
}

function buildInitialBlocks(workout: WorkoutData): Block[] {
  const blocks: Block[] = [];
  const routineExercises = (workout.routines?.routine_exercises ?? []).sort(
    (a, b) => a.order_index - b.order_index,
  );

  for (const re of routineExercises) {
    if (!re.exercises) continue;
    const matchingWe = workout.workout_exercises.find((we) => we.routine_exercise_id === re.id);
    blocks.push({
      key: re.id,
      exerciseId: re.exercise_id,
      exerciseName: re.exercises.name,
      plateIncrementKg: re.exercises.plate_increment_kg,
      thumbnailUrl: re.exercises.thumbnail_url,
      videoUrl: re.exercises.video_url,
      routineExerciseId: re.id,
      targetSets: [...re.target_sets].sort((a, b) => a.set_index - b.set_index),
      loggedSets: [...(matchingWe?.set_logs ?? [])].sort((a, b) => a.set_index - b.set_index),
    });
  }

  for (const we of workout.workout_exercises) {
    if (we.routine_exercise_id) continue;
    if (!we.exercises) continue;
    blocks.push({
      key: we.id,
      exerciseId: we.exercise_id,
      exerciseName: we.exercises.name,
      plateIncrementKg: we.exercises.plate_increment_kg,
      thumbnailUrl: we.exercises.thumbnail_url,
      videoUrl: we.exercises.video_url,
      routineExerciseId: null,
      targetSets: [],
      loggedSets: [...we.set_logs].sort((a, b) => a.set_index - b.set_index),
    });
  }

  return blocks;
}

export function WorkoutSession({
  workout,
  allExercises,
}: {
  workout: WorkoutData;
  allExercises: ExerciseOption[];
}) {
  const router = useRouter();
  const [blocks, setBlocks] = useState<Block[]>(() => buildInitialBlocks(workout));
  const [ended, setEnded] = useState(!!workout.ended_at);
  const [addExerciseId, setAddExerciseId] = useState("");
  const [finishing, setFinishing] = useState(false);

  function addFreestyleExercise() {
    const ex = allExercises.find((e) => e.id === addExerciseId);
    if (!ex) return;
    setBlocks((prev) => [
      ...prev,
      {
        key: `new-${ex.id}-${prev.length}`,
        exerciseId: ex.id,
        exerciseName: ex.name,
        plateIncrementKg: ex.plate_increment_kg,
        thumbnailUrl: ex.thumbnail_url,
        videoUrl: ex.video_url,
        routineExerciseId: null,
        targetSets: [],
        loggedSets: [],
      },
    ]);
    setAddExerciseId("");
  }

  async function logSet(block: Block, weightKg: number, reps: number, rpeActual: number) {
    const setIndex = block.loggedSets.length;
    const targetSet = block.targetSets[setIndex] ?? null;

    const res = await fetch(`/api/workouts/${workout.id}/sets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exerciseId: block.exerciseId,
        routineExerciseId: block.routineExerciseId,
        targetSetId: targetSet?.id ?? null,
        setIndex,
        weightKg,
        reps,
        rpeActual,
      }),
    });

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Error desconocido" }));
      toast.error(error);
      return;
    }

    const { setLog } = await res.json();
    setBlocks((prev) =>
      prev.map((b) => (b.key === block.key ? { ...b, loggedSets: [...b.loggedSets, setLog] } : b)),
    );

    if (targetSet?.target_rpe) {
      const targetReps = targetSet.target_reps_max ?? targetSet.target_reps_min ?? reps;
      const autoRes = await fetch("/api/autoregulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setLogId: setLog.id,
          targetReps,
          targetRpe: targetSet.target_rpe,
          actualWeightKg: weightKg,
          actualReps: reps,
          actualRpe: rpeActual,
          plateIncrementKg: block.plateIncrementKg,
        }),
      });
      if (autoRes.ok) {
        const suggestion = await autoRes.json();
        toast.info(suggestion.rationale);
      }
    } else {
      toast.success("Set registrado");
    }
  }

  async function finishWorkout() {
    setFinishing(true);
    const res = await fetch(`/api/workouts/${workout.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ended: true }),
    });
    setFinishing(false);
    if (!res.ok) {
      toast.error("No se pudo finalizar el entrenamiento");
      return;
    }
    setEnded(true);
    toast.success("Entrenamiento finalizado");
    router.push("/dashboard");
  }

  const availableExercises = allExercises.filter((e) => !blocks.some((b) => b.exerciseId === e.id));
  const availableExerciseItems = Object.fromEntries(availableExercises.map((e) => [e.id, e.name]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-lg font-semibold">
            {workout.routines?.title ?? "Entreno libre"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(workout.started_at), "dd/MM/yyyy HH:mm")}
          </p>
        </div>
        {ended ? (
          <Badge variant="secondary">Finalizado</Badge>
        ) : (
          <Button onClick={finishWorkout} disabled={finishing}>
            {finishing ? "Finalizando..." : "Finalizar entrenamiento"}
          </Button>
        )}
      </div>

      {blocks.map((block) => (
        <ExerciseBlockCard key={block.key} block={block} ended={ended} onLogSet={logSet} />
      ))}

      {!ended && (
        <Card>
          <CardHeader>
            <CardTitle>Agregar ejercicio</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end gap-2">
            <Select
              items={availableExerciseItems}
              value={addExerciseId}
              onValueChange={(v) => setAddExerciseId(v ?? "")}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Elegí un ejercicio" />
              </SelectTrigger>
              <SelectContent>
                {availableExercises.map((ex) => (
                  <SelectItem key={ex.id} value={ex.id}>
                    {ex.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" onClick={addFreestyleExercise} disabled={!addExerciseId}>
              Agregar
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ExerciseBlockCard({
  block,
  ended,
  onLogSet,
}: {
  block: Block;
  ended: boolean;
  onLogSet: (block: Block, weightKg: number, reps: number, rpeActual: number) => Promise<void>;
}) {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [rpe, setRpe] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const nextIndex = block.loggedSets.length;
  const nextTarget = block.targetSets[nextIndex] ?? null;
  const hasMoreTargets = block.targetSets.length === 0 || nextIndex < block.targetSets.length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const w = Number(weight);
    const r = Number(reps);
    const p = Number(rpe);
    if (!w || !r || !p) {
      toast.error("Completá peso, reps y RPE");
      return;
    }
    setSubmitting(true);
    await onLogSet(block, w, r, p);
    setSubmitting(false);
    setWeight("");
    setReps("");
    setRpe("");
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <ExerciseThumbnail src={block.thumbnailUrl} alt={block.exerciseName} className="size-11" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle>{block.exerciseName}</CardTitle>
              {nextTarget?.set_type && nextTarget.set_type !== "normal" && (
                <Badge className="bg-primary/15 text-primary">{SET_TYPE_LABELS[nextTarget.set_type] ?? nextTarget.set_type}</Badge>
              )}
            </div>
            {block.targetSets.length > 0 && (
              <CardDescription>
                {block.targetSets.length} sets objetivo
                {nextTarget?.target_reps_min &&
                  ` · ${nextTarget.target_reps_min}-${nextTarget.target_reps_max ?? nextTarget.target_reps_min} reps`}
                {nextTarget?.target_rpe && ` · RPE ${nextTarget.target_rpe}`}
              </CardDescription>
            )}
          </div>
          {block.videoUrl && (
            <Button
              variant="ghost"
              size="icon-sm"
              render={<a href={block.videoUrl} target="_blank" rel="noreferrer" />}
            >
              <PlayCircleIcon />
              <span className="sr-only">Ver ejecución</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {block.loggedSets.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="grid grid-cols-4 gap-2 border-b border-border bg-muted/40 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              <span>Set</span>
              <span>Kg</span>
              <span>Reps</span>
              <span>RPE</span>
            </div>
            {block.loggedSets.map((s) => (
              <div
                key={s.id}
                className="grid grid-cols-4 gap-2 border-b border-border/60 px-3 py-1.5 font-mono text-sm last:border-b-0"
              >
                <span className="text-muted-foreground">{s.set_index + 1}</span>
                <span>{s.weight_kg}</span>
                <span>{s.reps}</span>
                <span
                  className={
                    s.rpe_actual != null && s.rpe_actual >= 9
                      ? "text-destructive"
                      : s.rpe_actual != null && s.rpe_actual >= 7
                        ? "text-secondary"
                        : "text-foreground"
                  }
                >
                  {s.rpe_actual}
                </span>
              </div>
            ))}
          </div>
        )}

        {!ended && hasMoreTargets && (
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <Input
              type="number"
              step="0.5"
              placeholder="Peso (kg)"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className={cn(LOG_INPUT_CLASS, "w-24")}
            />
            <Input
              type="number"
              placeholder="Reps"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className={cn(LOG_INPUT_CLASS, "w-20")}
            />
            <Input
              type="number"
              step="0.5"
              min="5"
              max="10"
              placeholder="RPE"
              value={rpe}
              onChange={(e) => setRpe(e.target.value)}
              className={cn(LOG_INPUT_CLASS, "w-20")}
            />
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "..." : `Registrar set ${nextIndex + 1}`}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
