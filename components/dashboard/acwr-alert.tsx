import Link from "next/link";
import { AlertTriangleIcon, ArrowRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const ZONE_COPY = {
  precaucion: {
    bar: "bg-tertiary",
    text: "text-tertiary",
    title: "Precaución de sobrecarga",
    message:
      "Tu carga de esta semana está bastante por encima de tu promedio. Prestá atención a señales de fatiga antes de seguir subiendo peso.",
  },
  riesgo: {
    bar: "bg-destructive",
    text: "text-destructive",
    title: "Riesgo alto de sobrecarga",
    message:
      "Tu carga aguda está muy por encima de tu carga habitual — zona asociada a mayor riesgo de lesión. Considerá bajar volumen o adelantar un deload.",
  },
} as const;

export function AcwrAlert({ ratio, zone }: { ratio: number; zone: "precaucion" | "riesgo" }) {
  const copy = ZONE_COPY[zone];
  return (
    <Link
      href="/data"
      className="relative flex items-center gap-3 overflow-hidden rounded-lg border border-border bg-card p-4 hover:bg-muted/40"
    >
      <div className={cn("absolute inset-y-0 left-0 w-1", copy.bar)} />
      <AlertTriangleIcon className={cn("size-5 shrink-0", copy.text)} />
      <div className="min-w-0 flex-1">
        <p className={cn("font-heading text-sm font-bold uppercase tracking-wide", copy.text)}>
          {copy.title} · ACWR {ratio.toFixed(2)}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">{copy.message}</p>
      </div>
      <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
