"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SHIFT_TYPE_LABELS } from "@/lib/utils/shift-pattern";
import { willTrainByDefault } from "@/lib/utils/shift-pattern";
import type { ShiftType } from "@/lib/types/database";

interface ReadinessLogData {
  log_date: string;
  shift_type: ShiftType;
  will_train: boolean;
  sleep_hours: number | null;
  sleep_quality: number | null;
  stress_level: number | null;
  muscle_soreness: number | null;
  energy_level: number | null;
  notes: string | null;
}

export function ReadinessForm({
  today,
  defaultShiftType,
  initial,
}: {
  today: string;
  defaultShiftType: ShiftType;
  initial: ReadinessLogData | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [shiftType, setShiftType] = useState<ShiftType>(initial?.shift_type ?? defaultShiftType);
  const [willTrain, setWillTrain] = useState(
    initial?.will_train ?? willTrainByDefault(defaultShiftType),
  );
  const [sleepHours, setSleepHours] = useState(initial?.sleep_hours?.toString() ?? "");
  const [sleepQuality, setSleepQuality] = useState(initial?.sleep_quality?.toString() ?? "");
  const [stressLevel, setStressLevel] = useState(initial?.stress_level?.toString() ?? "");
  const [muscleSoreness, setMuscleSoreness] = useState(
    initial?.muscle_soreness?.toString() ?? "",
  );
  const [energyLevel, setEnergyLevel] = useState(initial?.energy_level?.toString() ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/readiness", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        logDate: today,
        shiftType,
        willTrain,
        sleepHours: sleepHours ? Number(sleepHours) : null,
        sleepQuality: sleepQuality ? Number(sleepQuality) : null,
        stressLevel: stressLevel ? Number(stressLevel) : null,
        muscleSoreness: muscleSoreness ? Number(muscleSoreness) : null,
        energyLevel: energyLevel ? Number(energyLevel) : null,
        notes: notes || null,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Error desconocido" }));
      toast.error(error);
      return;
    }
    toast.success("Readiness de hoy guardado");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label>Turno de hoy</Label>
        <Select
          items={SHIFT_TYPE_LABELS}
          value={shiftType}
          onValueChange={(v) => setShiftType(v as ShiftType)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SHIFT_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between rounded-lg border px-3 py-2">
        <Label htmlFor="will-train">¿Entrenás hoy?</Label>
        <Switch id="will-train" checked={willTrain} onCheckedChange={setWillTrain} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sleep-hours">Horas de sueño</Label>
          <Input
            id="sleep-hours"
            type="number"
            step="0.5"
            min="0"
            max="16"
            value={sleepHours}
            onChange={(e) => setSleepHours(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sleep-quality">Calidad de sueño (1-5)</Label>
          <Input
            id="sleep-quality"
            type="number"
            min="1"
            max="5"
            value={sleepQuality}
            onChange={(e) => setSleepQuality(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="stress">Estrés (1-5)</Label>
          <Input
            id="stress"
            type="number"
            min="1"
            max="5"
            value={stressLevel}
            onChange={(e) => setStressLevel(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="soreness">Dolor muscular (1-5)</Label>
          <Input
            id="soreness"
            type="number"
            min="1"
            max="5"
            value={muscleSoreness}
            onChange={(e) => setMuscleSoreness(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="energy">Energía (1-5)</Label>
          <Input
            id="energy"
            type="number"
            min="1"
            max="5"
            value={energyLevel}
            onChange={(e) => setEnergyLevel(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Guardando..." : "Guardar readiness"}
      </Button>
    </form>
  );
}
