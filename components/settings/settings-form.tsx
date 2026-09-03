"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SettingsData {
  goal: string | null;
  experience_years: number | null;
  shift_anchor_date: string | null;
  default_plate_increment_kg: number;
  injury_history: string | null;
  medical_notes: string | null;
}

export function SettingsForm({ initial }: { initial: SettingsData | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [goal, setGoal] = useState(initial?.goal ?? "");
  const [experienceYears, setExperienceYears] = useState(
    initial?.experience_years?.toString() ?? "",
  );
  const [shiftAnchorDate, setShiftAnchorDate] = useState(initial?.shift_anchor_date ?? "");
  const [plateIncrement, setPlateIncrement] = useState(
    initial?.default_plate_increment_kg?.toString() ?? "2.5",
  );
  const [injuryHistory, setInjuryHistory] = useState(initial?.injury_history ?? "");
  const [medicalNotes, setMedicalNotes] = useState(initial?.medical_notes ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goal: goal || null,
        experienceYears: experienceYears ? Number(experienceYears) : null,
        shiftAnchorDate: shiftAnchorDate || null,
        defaultPlateIncrementKg: plateIncrement ? Number(plateIncrement) : 2.5,
        injuryHistory: injuryHistory || null,
        medicalNotes: medicalNotes || null,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Error desconocido" }));
      toast.error(error);
      return;
    }
    toast.success("Ajustes guardados");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="goal">Objetivo</Label>
        <Input
          id="goal"
          placeholder="Ej: recomposición corporal"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="experience">Años de experiencia</Label>
          <Input
            id="experience"
            type="number"
            step="0.5"
            min="0"
            value={experienceYears}
            onChange={(e) => setExperienceYears(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="plate">Incremento de disco (kg)</Label>
          <Input
            id="plate"
            type="number"
            step="0.5"
            min="0"
            value={plateIncrement}
            onChange={(e) => setPlateIncrement(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="anchor">
          Fecha ancla del turno (un día que hayas sido &quot;Día 1 — Turno diurno&quot;)
        </Label>
        <Input
          id="anchor"
          type="date"
          value={shiftAnchorDate}
          onChange={(e) => setShiftAnchorDate(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5 border-t border-border pt-4">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Ficha clínica
        </p>
        <Label htmlFor="injury-history">Historial de lesiones</Label>
        <Textarea
          id="injury-history"
          rows={3}
          placeholder="Lesiones previas, cirugías, zonas a cuidar..."
          value={injuryHistory}
          onChange={(e) => setInjuryHistory(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="medical-notes">Notas médicas</Label>
        <Textarea
          id="medical-notes"
          rows={3}
          placeholder="Condiciones a tener en cuenta, restricciones, indicaciones de kinesiología..."
          value={medicalNotes}
          onChange={(e) => setMedicalNotes(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={loading} className="self-start">
        {loading ? "Guardando..." : "Guardar ajustes"}
      </Button>
    </form>
  );
}
