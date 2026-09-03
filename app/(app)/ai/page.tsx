import { format } from "date-fns";
import { SparklesIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GenerateButton } from "@/components/ai/generate-button";
import { RunReviewCard } from "@/components/ai/run-review-card";
import { PeriodizationDecisionSchema } from "@/lib/ai/schema";

const STATUS_LABELS: Record<string, string> = {
  pending_review: "Pendiente",
  approved: "Aprobada",
  applied: "Aplicada",
  rejected: "Rechazada",
  error: "Error",
};

export default async function AiPage() {
  const supabase = await createClient();
  const { data: runs } = await supabase
    .from("ai_periodization_runs")
    .select("*")
    .order("triggered_at", { ascending: false })
    .limit(20);

  const pending = (runs ?? []).filter((r) => r.status === "pending_review");
  const history = (runs ?? []).filter((r) => r.status !== "pending_review");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <SparklesIcon className="size-4 text-secondary" />
            <h1 className="font-heading text-lg font-semibold">Prescripción Clínica & Periodización IA</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Genera una propuesta para el próximo microciclo a partir de tu readiness, ficha clínica y desempeño real.
          </p>
        </div>
        <GenerateButton />
      </div>

      {pending.map((run) => {
        const parsed = PeriodizationDecisionSchema.safeParse(run.raw_output);
        if (!parsed.success) {
          return (
            <Card key={run.id}>
              <CardContent className="pt-4 text-sm text-muted-foreground">
                Propuesta con formato inválido ({format(new Date(run.triggered_at), "dd/MM/yyyy HH:mm")}).
              </CardContent>
            </Card>
          );
        }
        return (
          <RunReviewCard
            key={run.id}
            runId={run.id}
            triggeredAt={run.triggered_at}
            decision={parsed.data}
          />
        );
      })}

      <Card>
        <CardHeader>
          <CardTitle>Historial</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {history.length === 0 && (
            <p className="text-sm text-muted-foreground">Todavía no hay propuestas anteriores.</p>
          )}
          {history.map((run) => (
            <div key={run.id} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {format(new Date(run.triggered_at), "dd/MM/yyyy HH:mm")}
                {run.error_message && ` · ${run.error_message}`}
              </span>
              <Badge variant="outline">{STATUS_LABELS[run.status] ?? run.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
