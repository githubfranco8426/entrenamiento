import { AlertTriangleIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export interface StagnantExercise {
  exerciseName: string;
  sessionsStagnant: number;
  lastWeightKg: number;
  targetWeightKg: number | null;
}

export function StagnationAlert({ exercises }: { exercises: StagnantExercise[] }) {
  if (exercises.length === 0) return null;

  return (
    <Card className="border-destructive/40 ring-1 ring-destructive/40">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangleIcon className="size-4 text-destructive" />
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-destructive">
            Estancamiento detectado
          </CardTitle>
        </div>
        <CardDescription>Sin subir peso en las últimas sesiones.</CardDescription>
      </CardHeader>
      <div className="flex flex-col divide-y divide-border px-(--card-spacing)">
        {exercises.map((ex) => (
          <div key={ex.exerciseName} className="flex items-center justify-between gap-3 py-2 text-sm">
            <div>
              <p className="font-medium">{ex.exerciseName}</p>
              <p className="font-mono text-xs text-destructive">
                {ex.sessionsStagnant} sesiones sin progreso
              </p>
            </div>
            <div className="text-right font-mono text-xs text-muted-foreground">
              <p>{ex.lastWeightKg} kg</p>
              {ex.targetWeightKg != null && <p>Target: {ex.targetWeightKg} kg</p>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
