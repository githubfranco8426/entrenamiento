"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { PeriodizationDecision } from "@/lib/ai/schema";

const SEVERITY_VARIANT: Record<string, "outline" | "secondary" | "destructive"> = {
  info: "outline",
  atencion: "secondary",
  alerta: "destructive",
};

export function RunReviewCard({
  runId,
  triggeredAt,
  decision,
}: {
  runId: string;
  triggeredAt: string;
  decision: PeriodizationDecision;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");

  async function approve() {
    setLoading(true);
    const res = await fetch(`/api/ai/runs/${runId}/approve`, { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Error desconocido" }));
      toast.error(error);
      return;
    }
    toast.success("Propuesta aplicada — se creó el próximo microciclo");
    router.refresh();
  }

  async function reject() {
    setLoading(true);
    const res = await fetch(`/api/ai/runs/${runId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: comment || null }),
    });
    setLoading(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Error desconocido" }));
      toast.error(error);
      return;
    }
    toast.success("Propuesta rechazada");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Propuesta pendiente</CardTitle>
        <CardDescription>{format(new Date(triggeredAt), "dd/MM/yyyy HH:mm")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm">{decision.summary}</p>

        <div className="rounded-lg border p-3 text-sm">
          <p className="font-medium">
            {decision.phaseTransition.shouldTransition
              ? `Transición de fase: ${decision.phaseTransition.fromPhase} → ${decision.phaseTransition.toPhase}`
              : `Se mantiene en fase ${decision.phaseTransition.fromPhase}`}
            {decision.phaseTransition.isDeloadWeek && " · próxima semana de deload"}
          </p>
          <p className="mt-1 text-muted-foreground">{decision.phaseTransition.justification}</p>
        </div>

        <div className="flex flex-col gap-2">
          {decision.nextMicrocycleTargets.map((routine, i) => (
            <div key={i}>
              {i > 0 && <Separator className="my-2" />}
              <p className="text-sm font-medium">{routine.dayLabel}</p>
              <ul className="mt-1 flex flex-col gap-0.5 text-xs text-muted-foreground">
                {routine.exercises.map((ex, j) => (
                  <li key={j}>
                    {ex.exerciseName} — {ex.targetSets}x{ex.targetRepRangeMin}-
                    {ex.targetRepRangeMax} @RPE{ex.targetRpe}
                    {ex.targetWeightKg != null && ` · ${ex.targetWeightKg}kg`}
                    {ex.notes && ` · ${ex.notes}`}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {decision.warnings.length > 0 && (
          <div className="flex flex-col gap-1">
            {decision.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <Badge variant={SEVERITY_VARIANT[w.severity] ?? "outline"}>{w.severity}</Badge>
                <span className="text-muted-foreground">{w.message}</span>
              </div>
            ))}
          </div>
        )}

        {decision.shiftAdjustmentNotes && (
          <p className="text-xs text-muted-foreground">{decision.shiftAdjustmentNotes}</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Dialog>
          <DialogTrigger render={<Button variant="outline" disabled={loading}>Rechazar</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rechazar propuesta</DialogTitle>
            </DialogHeader>
            <Textarea
              placeholder="Motivo (opcional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <DialogFooter>
              <Button variant="destructive" onClick={reject} disabled={loading}>
                Confirmar rechazo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button onClick={approve} disabled={loading}>
          {loading ? "Aplicando..." : "Aprobar y aplicar"}
        </Button>
      </CardFooter>
    </Card>
  );
}
