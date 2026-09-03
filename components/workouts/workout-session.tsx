"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { repsInReserve } from "@/lib/autoregulation/rpe-tables";
import { fetchWithAuthRetry } from "@/lib/supabase/fetch-with-auth-retry";
import { Button } from "@/components/ui/button";
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
import { WorkoutSummary } from "@/components/workouts/workout-summary";
import { useRestTimer } from "@/components/workouts/rest-timer-context";
import { PlayCircleIcon, CheckIcon, PlusIcon, XIcon, MinusIcon, PencilIcon, TrashIcon, ClockIcon, RotateCcwIcon } from "lucide-react";

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
  target_weight_kg: number | null;
  rest_seconds: number | null;
}

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
  notes: string | null;
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
  notes: string | null;
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
      notes: re.notes,
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
      notes: null,
      targetSets: [],
      loggedSets: [...we.set_logs].sort((a, b) => a.set_index - b.set_index),
    });
  }

  return blocks;
}

export function WorkoutSession({
  workout,
  allExercises,
  estimatedOneRepMaxByExercise,
}: {
  workout: WorkoutData;
  allExercises: ExerciseOption[];
  estimatedOneRepMaxByExercise: Record<string, number>;
}) {
  const router = useRouter();
  const [blocks, setBlocks] = useState<Block[]>(() => buildInitialBlocks(workout));
  const [extraRowsByBlock, setExtraRowsByBlock] = useState<Record<string, number>>({});
  const [ended, setEnded] = useState(!!workout.ended_at);
  const [endedAt, setEndedAt] = useState(workout.ended_at);
  const [addExerciseId, setAddExerciseId] = useState("");
  const [finishing, setFinishing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reopening, setReopening] = useState(false);
  const hasLoggedSets = blocks.some((b) => b.loggedSets.length > 0);

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
        notes: null,
        targetSets: [],
        loggedSets: [],
      },
    ]);
    setAddExerciseId("");
  }

  async function logSet(block: Block, weightKg: number, reps: number, rpeActual: number) {
    const setIndex = block.loggedSets.length;
    const targetSet = block.targetSets[setIndex] ?? null;
    const tempId = `temp-${block.key}-${setIndex}-${Date.now()}`;

    // Optimista: el set se muestra como hecho de inmediato; la red corre en segundo plano.
    // Esto evita que el check se sienta lento esperando la ida y vuelta al servidor.
    setBlocks((prev) =>
      prev.map((b) =>
        b.key === block.key
          ? {
              ...b,
              loggedSets: [
                ...b.loggedSets,
                { id: tempId, set_index: setIndex, weight_kg: weightKg, reps, rpe_actual: rpeActual },
              ],
            }
          : b,
      ),
    );

    const res = await fetchWithAuthRetry(`/api/workouts/${workout.id}/sets`, {
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
      setBlocks((prev) =>
        prev.map((b) =>
          b.key === block.key ? { ...b, loggedSets: b.loggedSets.filter((s) => s.id !== tempId) } : b,
        ),
      );
      return;
    }

    const { setLog } = await res.json();
    setBlocks((prev) =>
      prev.map((b) =>
        b.key === block.key
          ? { ...b, loggedSets: b.loggedSets.map((s) => (s.id === tempId ? setLog : s)) }
          : b,
      ),
    );

    if (targetSet?.target_rpe) {
      const targetReps = targetSet.target_reps_max ?? targetSet.target_reps_min ?? reps;
      // Fire-and-forget: la sugerencia de autoregulación no debe bloquear el siguiente set.
      fetchWithAuthRetry("/api/autoregulate", {
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
      })
        .then((autoRes) => (autoRes.ok ? autoRes.json() : null))
        .then((suggestion) => suggestion && toast.info(suggestion.rationale))
        .catch(() => {});
    } else {
      toast.success("Set registrado");
    }
  }

  async function updateSet(block: Block, setLogId: string, weightKg: number, reps: number, rpeActual: number) {
    const prevSets = block.loggedSets;
    setBlocks((prev) =>
      prev.map((b) =>
        b.key === block.key
          ? {
              ...b,
              loggedSets: b.loggedSets.map((s) =>
                s.id === setLogId ? { ...s, weight_kg: weightKg, reps, rpe_actual: rpeActual } : s,
              ),
            }
          : b,
      ),
    );

    const res = await fetchWithAuthRetry(`/api/workouts/${workout.id}/sets/${setLogId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weightKg, reps, rpeActual }),
    });

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Error desconocido" }));
      toast.error(error);
      setBlocks((prev) => prev.map((b) => (b.key === block.key ? { ...b, loggedSets: prevSets } : b)));
      return;
    }
    toast.success("Set actualizado");
  }

  async function deleteSet(block: Block, setLogId: string) {
    if (!window.confirm("¿Borrar este set?")) return;
    const prevSets = block.loggedSets;
    setBlocks((prev) =>
      prev.map((b) =>
        b.key === block.key ? { ...b, loggedSets: b.loggedSets.filter((s) => s.id !== setLogId) } : b,
      ),
    );

    const res = await fetchWithAuthRetry(`/api/workouts/${workout.id}/sets/${setLogId}`, { method: "DELETE" });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Error desconocido" }));
      toast.error(error);
      setBlocks((prev) => prev.map((b) => (b.key === block.key ? { ...b, loggedSets: prevSets } : b)));
      return;
    }
    toast.success("Set borrado");
  }

  async function cancelWorkout() {
    if (!window.confirm("¿Anular este entrenamiento? Se borrará junto con las series ya registradas.")) return;
    setCancelling(true);
    const res = await fetchWithAuthRetry(`/api/workouts/${workout.id}`, { method: "DELETE" });
    setCancelling(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Error desconocido" }));
      toast.error(error);
      return;
    }
    toast.success("Entrenamiento anulado");
    router.push("/dashboard");
  }

  async function finishWorkout() {
    setFinishing(true);
    const res = await fetchWithAuthRetry(`/api/workouts/${workout.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ended: true }),
    });
    setFinishing(false);
    if (!res.ok) {
      toast.error("No se pudo finalizar el entrenamiento");
      return;
    }
    const { workout: updated } = await res.json();
    setEnded(true);
    setEndedAt(updated.ended_at);
    toast.success("¡Entrenamiento finalizado! Acá tenés tu informe.");
  }

  async function reopenWorkout() {
    setReopening(true);
    const res = await fetchWithAuthRetry(`/api/workouts/${workout.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ended: false }),
    });
    setReopening(false);
    if (!res.ok) {
      toast.error("No se pudo reabrir el entrenamiento");
      return;
    }
    setEnded(false);
    setEndedAt(null);
    toast.success("Entrenamiento reabierto — ya podés editarlo");
  }

  const availableExercises = allExercises.filter((e) => !blocks.some((b) => b.exerciseId === e.id));
  const availableExerciseItems = Object.fromEntries(availableExercises.map((e) => [e.id, e.name]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {workout.routines?.day_label ?? "Entreno libre"}
          </p>
          <h1 className="font-heading text-xl font-bold uppercase tracking-tight">
            {workout.routines?.title ?? "Entreno libre"}
          </h1>
          <p className="font-mono text-xs text-muted-foreground">
            {format(new Date(workout.started_at), "dd/MM/yyyy HH:mm")}
          </p>
          {!ended && <WorkoutStopwatch startedAt={workout.started_at} />}
        </div>
        {ended ? (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Finalizado</Badge>
            <Button variant="outline" size="sm" onClick={reopenWorkout} disabled={reopening} className="gap-1.5">
              <RotateCcwIcon className="size-3.5" />
              {reopening ? "Reabriendo..." : "Reabrir"}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={cancelWorkout}
              disabled={cancelling || finishing}
              aria-label="Cancelar entrenamiento"
              title={hasLoggedSets ? "Anula el entrenamiento y borra las series ya registradas" : "Anula el entrenamiento"}
            >
              <XIcon className="size-4" />
              {cancelling ? "Anulando..." : "Cancelar"}
            </Button>
            <Button onClick={finishWorkout} disabled={finishing || cancelling} className="font-semibold uppercase tracking-wide">
              {finishing ? "Finalizando..." : "Finalizar"}
            </Button>
          </div>
        )}
      </div>

      {ended && endedAt && (
        <WorkoutSummary
          startedAt={workout.started_at}
          endedAt={endedAt}
          blocks={blocks.map((b) => ({
            exerciseName: b.exerciseName,
            loggedSets: b.loggedSets,
            estimatedOneRepMaxKg: estimatedOneRepMaxByExercise[b.exerciseId] ?? null,
          }))}
        />
      )}

      {blocks.map((block) => (
        <ExerciseBlockCard
          key={block.key}
          block={block}
          ended={ended}
          onLogSet={logSet}
          onUpdateSet={updateSet}
          onDeleteSet={deleteSet}
          estimatedOneRepMaxKg={estimatedOneRepMaxByExercise[block.exerciseId] ?? null}
          extraRows={extraRowsByBlock[block.key] ?? 0}
          onAddRow={() =>
            setExtraRowsByBlock((prev) => ({ ...prev, [block.key]: (prev[block.key] ?? 0) + 1 }))
          }
        />
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

/** RIR por defecto cuando el set objetivo no define target_rpe (p. ej. ejercicios libres). */
const DEFAULT_TARGET_RIR = 2;

const RIR_OPTIONS = [
  { label: "RIR 0-1", sub: "RPE 9-10", value: 1 },
  { label: "RIR 2-3", sub: "RPE 7-8", value: 2 },
  { label: "RIR 4+", sub: "RPE ≤6", value: 4 },
] as const;

function closestRirOption(rir: number): (typeof RIR_OPTIONS)[number]["value"] {
  let closest: (typeof RIR_OPTIONS)[number]["value"] = RIR_OPTIONS[0].value;
  for (const opt of RIR_OPTIONS) {
    if (Math.abs(opt.value - rir) < Math.abs(closest - rir)) closest = opt.value;
  }
  return closest;
}

const ROW_GRID = "grid grid-cols-[2.5rem_1fr_1fr_3.5rem_2.75rem] items-center gap-2";

function formatRest(seconds: number | null): string | null {
  if (!seconds) return null;
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return rem === 0 ? `${min} min` : `${min}:${String(rem).padStart(2, "0")} min`;
}

/** Rest timer por defecto cuando el set objetivo no define rest_seconds. */
const DEFAULT_REST_SECONDS = 90;

function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(h > 0 ? 2 : 1, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${mm}:${ss}`;
}

/** Cronómetro en vivo del entrenamiento completo — recalcula desde workout.started_at,
 * así que sobrevive a navegar a otra pantalla y volver (no depende de estado en memoria). */
function WorkoutStopwatch({ startedAt }: { startedAt: string }) {
  const startedAtMs = new Date(startedAt).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsedSeconds = Math.max(0, Math.floor((now - startedAtMs) / 1000));

  return (
    <span className="mt-0.5 flex items-center gap-1 font-mono text-sm font-semibold text-secondary">
      <ClockIcon className="size-3.5" />
      {formatElapsed(elapsedSeconds)}
    </span>
  );
}

function ExerciseBlockCard({
  block,
  ended,
  onLogSet,
  onUpdateSet,
  onDeleteSet,
  estimatedOneRepMaxKg,
  extraRows,
  onAddRow,
}: {
  block: Block;
  ended: boolean;
  onLogSet: (block: Block, weightKg: number, reps: number, rpeActual: number) => Promise<void>;
  onUpdateSet: (block: Block, setLogId: string, weightKg: number, reps: number, rpeActual: number) => Promise<void>;
  onDeleteSet: (block: Block, setLogId: string) => Promise<void>;
  estimatedOneRepMaxKg: number | null;
  extraRows: number;
  onAddRow: () => void;
}) {
  const nextIndex = block.loggedSets.length;
  const nextTarget = block.targetSets[nextIndex] ?? null;
  const allTargetsLogged = nextIndex >= block.targetSets.length;
  const rowCount = Math.max(block.targetSets.length, nextIndex + (ended ? 0 : 1)) + (allTargetsLogged ? extraRows : 0);

  const headerTarget = nextTarget ?? block.targetSets[0] ?? null;
  const targetRir = headerTarget?.target_rpe != null ? Math.round(repsInReserve(headerTarget.target_rpe)) : null;
  const restLabel = formatRest(headerTarget?.rest_seconds ?? null);

  const prevLoggedCountRef = useRef(block.loggedSets.length);
  const restTimer = useRestTimer();

  useEffect(() => {
    const prevCount = prevLoggedCountRef.current;
    const newCount = block.loggedSets.length;
    if (newCount > prevCount && !ended) {
      const justCompletedTarget = block.targetSets[newCount - 1] ?? null;
      restTimer.start(justCompletedTarget?.rest_seconds ?? DEFAULT_REST_SECONDS, block.exerciseName);
    }
    prevLoggedCountRef.current = newCount;
    // restTimer.start es estable (useCallback), no hace falta en deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.loggedSets.length, block.targetSets, block.exerciseName, ended]);

  return (
    <Card className="overflow-hidden py-0 gap-0">
      <CardHeader className="flex-row items-center justify-between gap-3 border-b border-border bg-muted/30 py-3">
        <div className="flex items-center gap-3">
          <ExerciseThumbnail src={block.thumbnailUrl} alt={block.exerciseName} className="size-11" />
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{block.exerciseName}</CardTitle>
              {nextTarget?.set_type && nextTarget.set_type !== "normal" && (
                <Badge className="bg-primary/15 text-primary">{SET_TYPE_LABELS[nextTarget.set_type] ?? nextTarget.set_type}</Badge>
              )}
            </div>
            {(targetRir != null || restLabel) && (
              <CardDescription className="font-mono text-xs">
                {targetRir != null && `Target RIR ${targetRir}`}
                {targetRir != null && restLabel && " · "}
                {restLabel && `Descanso ${restLabel}`}
              </CardDescription>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {estimatedOneRepMaxKg != null && (
            <span className="whitespace-nowrap rounded-md border border-border bg-card px-2 py-1 font-mono text-xs text-secondary">
              e1RM {estimatedOneRepMaxKg}kg
            </span>
          )}
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
      <CardContent className="flex flex-col gap-0 px-0 pb-0">
        {block.notes && (
          <p className="border-b border-border bg-secondary/10 px-3 py-2 text-xs text-secondary">{block.notes}</p>
        )}
        <div className={cn(ROW_GRID, "border-b border-border px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground")}>
          <span className="text-center">Set</span>
          <span className="text-center">Kg</span>
          <span className="text-center">Reps</span>
          <span className="text-center">Rir</span>
          <span className="text-center">Ok</span>
        </div>

        {Array.from({ length: rowCount }, (_, i) => i).map((i) => {
          const loggedSet = block.loggedSets[i] ?? null;
          const targetSet = block.targetSets[i] ?? null;
          const status: "done" | "active" | "pending" = loggedSet ? "done" : i === nextIndex ? "active" : "pending";
          return (
            <SetRow
              key={loggedSet?.id ?? i}
              index={i}
              status={ended && status === "active" ? "pending" : status}
              loggedSet={loggedSet}
              targetSet={targetSet}
              editable={!ended}
              onSubmit={(weightKg, reps, rpeActual) => onLogSet(block, weightKg, reps, rpeActual)}
              onUpdate={(weightKg, reps, rpeActual) =>
                loggedSet ? onUpdateSet(block, loggedSet.id, weightKg, reps, rpeActual) : Promise.resolve()
              }
              onDelete={() => (loggedSet ? onDeleteSet(block, loggedSet.id) : Promise.resolve())}
            />
          );
        })}

        {!ended && allTargetsLogged && (
          <button
            type="button"
            onClick={onAddRow}
            className="flex items-center justify-center gap-1.5 border-b border-border py-2.5 font-mono text-xs font-medium uppercase tracking-wide text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <PlusIcon className="size-3.5" />
            Agregar set
          </button>
        )}
      </CardContent>
    </Card>
  );
}

function SetRow({
  index,
  status,
  loggedSet,
  targetSet,
  editable,
  onSubmit,
  onUpdate,
  onDelete,
}: {
  index: number;
  status: "done" | "active" | "pending";
  loggedSet: SetLog | null;
  targetSet: TargetSet | null;
  editable: boolean;
  onSubmit: (weightKg: number, reps: number, rpeActual: number) => Promise<void>;
  onUpdate: (weightKg: number, reps: number, rpeActual: number) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const defaultWeight = targetSet?.target_weight_kg != null ? String(targetSet.target_weight_kg) : "";
  const defaultReps =
    targetSet?.target_reps_max != null
      ? String(targetSet.target_reps_max)
      : targetSet?.target_reps_min != null
        ? String(targetSet.target_reps_min)
        : "";
  const defaultRir = targetSet?.target_rpe != null ? String(Math.round(repsInReserve(targetSet.target_rpe))) : String(DEFAULT_TARGET_RIR);

  const [weight, setWeight] = useState(defaultWeight);
  const [reps, setReps] = useState(defaultReps);
  const [rir, setRir] = useState(defaultRir);
  const [submitting, setSubmitting] = useState(false);

  if (status === "done" && loggedSet) {
    return (
      <DoneSetRow
        index={index}
        loggedSet={loggedSet}
        editable={editable}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    );
  }

  if (status === "pending") {
    return (
      <div className={cn(ROW_GRID, "border-b border-border/60 px-3 py-1.5 opacity-40")}>
        <span className="text-center font-mono text-sm text-muted-foreground">{index + 1}</span>
        <span className="text-center font-mono text-sm text-muted-foreground">{weight || "-"}</span>
        <span className="text-center font-mono text-sm text-muted-foreground">{reps || "-"}</span>
        <span className="text-center font-mono text-sm text-muted-foreground">{rir}</span>
        <span />
      </div>
    );
  }

  const repsValue = Number(reps) || 0;

  function stepReps(delta: number) {
    setReps(String(Math.max(1, repsValue + delta)));
  }

  async function handleDone() {
    const w = Number(weight);
    const r = Number(reps);
    const rirValue = Number(rir);
    if (!w || !r || rir === "" || Number.isNaN(rirValue)) {
      toast.error("Completá kg, reps y RIR");
      return;
    }
    const rpeActual = Math.min(10, Math.max(5, 10 - rirValue));
    setSubmitting(true);
    await onSubmit(w, r, rpeActual);
    setSubmitting(false);
  }

  const selectedRirOption = rir !== "" ? closestRirOption(Number(rir)) : null;

  return (
    <div className="flex flex-col gap-3 border-b border-border/60 bg-primary/5 p-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">Set {index + 1}</span>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            step="0.5"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder={defaultWeight || "-"}
            className="h-9 w-20 rounded-md border border-border bg-card text-center font-mono text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <span className="font-mono text-xs text-muted-foreground">kg</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-5">
        <button
          type="button"
          onClick={() => stepReps(-1)}
          className="flex size-10 items-center justify-center rounded-full bg-card text-foreground hover:bg-muted active:scale-90"
        >
          <MinusIcon className="size-5" />
        </button>
        <div className="flex flex-col items-center">
          <span className="font-mono text-3xl font-bold tracking-tight text-primary">{reps || "-"}</span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">reps</span>
        </div>
        <button
          type="button"
          onClick={() => stepReps(1)}
          className="flex size-10 items-center justify-center rounded-full bg-card text-primary hover:bg-muted active:scale-90"
        >
          <PlusIcon className="size-5" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {RIR_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setRir(String(opt.value))}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-lg p-2 text-center transition-colors",
              selectedRirOption === opt.value ? "bg-primary/15" : "bg-card hover:bg-muted",
            )}
          >
            <span className={cn("font-mono text-sm font-bold", selectedRirOption === opt.value ? "text-primary" : "text-secondary")}>
              {opt.label}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">{opt.sub}</span>
          </button>
        ))}
      </div>

      <Button
        type="button"
        onClick={handleDone}
        disabled={submitting}
        className="w-full gap-2 font-semibold"
      >
        <CheckIcon className="size-4" />
        Registrar set {index + 1} ({reps || "-"} reps @ {weight || "-"}kg)
      </Button>
    </div>
  );
}

function DoneSetRow({
  index,
  loggedSet,
  editable,
  onUpdate,
  onDelete,
}: {
  index: number;
  loggedSet: SetLog;
  editable: boolean;
  onUpdate: (weightKg: number, reps: number, rpeActual: number) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [weight, setWeight] = useState(String(loggedSet.weight_kg ?? ""));
  const [reps, setReps] = useState(String(loggedSet.reps ?? ""));
  const doneRir = loggedSet.rpe_actual != null ? Math.round(repsInReserve(loggedSet.rpe_actual)) : null;
  const [rir, setRir] = useState(String(doneRir ?? DEFAULT_TARGET_RIR));
  const [saving, setSaving] = useState(false);

  if (!editing) {
    return (
      <div className={cn(ROW_GRID, "border-b border-border/60 px-3 py-1.5 font-mono text-sm text-muted-foreground")}>
        <span className="text-center">{index + 1}</span>
        <span className="text-center text-foreground">{loggedSet.weight_kg ?? "—"}</span>
        <span className="text-center text-foreground">{loggedSet.reps ?? "—"}</span>
        <span className="text-center">{doneRir ?? "—"}</span>
        {editable ? (
          <button
            type="button"
            onClick={() => {
              setWeight(String(loggedSet.weight_kg ?? ""));
              setReps(String(loggedSet.reps ?? ""));
              setRir(String(doneRir ?? DEFAULT_TARGET_RIR));
              setEditing(true);
            }}
            aria-label="Editar set"
            className="flex size-6 items-center justify-center justify-self-center rounded-md bg-primary text-primary-foreground hover:bg-primary/80"
          >
            <PencilIcon className="size-3.5" />
          </button>
        ) : (
          <span className="flex justify-center">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <CheckIcon className="size-3.5" />
            </span>
          </span>
        )}
      </div>
    );
  }

  async function handleSave() {
    const w = Number(weight);
    const r = Number(reps);
    const rirValue = Number(rir);
    if (!w || !r || rir === "" || Number.isNaN(rirValue)) {
      toast.error("Completá kg, reps y RIR");
      return;
    }
    const rpeActual = Math.min(10, Math.max(5, 10 - rirValue));
    setSaving(true);
    await onUpdate(w, r, rpeActual);
    setSaving(false);
    setEditing(false);
  }

  async function handleDelete() {
    setSaving(true);
    await onDelete();
    setSaving(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border/60 bg-secondary/5 px-3 py-2">
      <span className="w-6 text-center font-mono text-sm text-muted-foreground">{index + 1}</span>
      <input
        type="number"
        step="0.5"
        inputMode="decimal"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        className="h-8 w-16 rounded-md border border-border bg-card text-center font-mono text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
      />
      <span className="font-mono text-xs text-muted-foreground">kg ×</span>
      <input
        type="number"
        inputMode="numeric"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        className="h-8 w-14 rounded-md border border-border bg-card text-center font-mono text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
      />
      <span className="font-mono text-xs text-muted-foreground">reps · RIR</span>
      <input
        type="number"
        min="0"
        max="5"
        inputMode="numeric"
        value={rir}
        onChange={(e) => setRir(e.target.value)}
        className="h-8 w-12 rounded-md border border-secondary/40 bg-secondary/10 text-center font-mono text-sm text-secondary outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
      />
      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleDelete}
          disabled={saving}
          aria-label="Borrar set"
          className="flex size-8 items-center justify-center rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10 disabled:opacity-40"
        >
          <TrashIcon className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          disabled={saving}
          aria-label="Cancelar"
          className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted disabled:opacity-40"
        >
          <XIcon className="size-4" />
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          aria-label="Guardar"
          className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/80 disabled:opacity-40"
        >
          <CheckIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}
