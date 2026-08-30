"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function BodyMetricForm({
  today,
  initial,
}: {
  today: string;
  initial: { weight_kg: number | null; body_fat_pct: number | null } | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [weightKg, setWeightKg] = useState(initial?.weight_kg?.toString() ?? "");
  const [bodyFatPct, setBodyFatPct] = useState(initial?.body_fat_pct?.toString() ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/body-metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        logDate: today,
        weightKg: weightKg ? Number(weightKg) : null,
        bodyFatPct: bodyFatPct ? Number(bodyFatPct) : null,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Error desconocido" }));
      toast.error(error);
      return;
    }
    toast.success("Métricas guardadas");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="weight">Peso (kg)</Label>
        <Input
          id="weight"
          type="number"
          step="0.1"
          value={weightKg}
          onChange={(e) => setWeightKg(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bodyfat">% Grasa</Label>
        <Input
          id="bodyfat"
          type="number"
          step="0.1"
          value={bodyFatPct}
          onChange={(e) => setBodyFatPct(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Guardando..." : "Guardar"}
      </Button>
    </form>
  );
}
