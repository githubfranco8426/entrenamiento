import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { FOOD_REPLACEMENTS } from "@/lib/nutrition/plan";
import { Card, CardContent } from "@/components/ui/card";

export default function ReplacementsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/nutricion" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon className="size-4" /> Nutrición
        </Link>
        <h1 className="mt-2 font-heading text-xl font-bold">Reemplazos</h1>
        <p className="text-sm text-muted-foreground">Alternativas con macros equivalentes.</p>
      </div>

      <div className="flex flex-col gap-2">
        {FOOD_REPLACEMENTS.map((r) => (
          <Card key={r.original}>
            <CardContent className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-primary">{r.original}</span>
              <span className="text-xs text-muted-foreground">{r.alternatives}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
