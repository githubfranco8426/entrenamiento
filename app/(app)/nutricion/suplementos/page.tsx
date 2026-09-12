import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { SUPPLEMENT_CHECKLIST } from "@/lib/nutrition/plan";
import { Card, CardContent } from "@/components/ui/card";

export default function SupplementsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/nutricion" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon className="size-4" /> Nutrición
        </Link>
        <h1 className="mt-2 font-heading text-xl font-bold">Suplementos</h1>
      </div>

      <div className="flex flex-col gap-2">
        {SUPPLEMENT_CHECKLIST.map((s) => (
          <Card key={s.name}>
            <CardContent className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{s.name}</span>
                <span className="font-mono text-xs text-primary">{s.dose}</span>
              </div>
              <p className="text-xs text-muted-foreground">{s.timing}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
