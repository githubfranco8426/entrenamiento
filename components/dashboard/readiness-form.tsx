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

import type { ReadinessLogData, ClinicalCheckin } from "@/lib/readiness/model";

export function ReadinessForm({
  today,
  defaultShiftType,
  initial,
  clinical,
  onSaved,
}: {
  today: string;
  defaultShiftType: ShiftType;
  initial: ReadinessLogData | null;
  clinical?: ClinicalCheckin | null;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [shiftType, setShiftType] = useState<ShiftType>(
    initial?.shift_type ?? defaultShiftType,
  );
  const [willTrain, setWillTrain] = useState(
    initial?.will_train ?? willTrainByDefault(defaultShiftType),
  );
  const [sleepHours, setSleepHours] = useState(
    initial?.sleep_hours?.toString() ?? "",
  );
  const [sleepQuality, setSleepQuality] = useState(
    initial?.sleep_quality?.toString() ?? "",
  );
  const [stressLevel, setStressLevel] = useState(
    initial?.stress_level?.toString() ?? "",
  );
  const [muscleSoreness, setMuscleSoreness] = useState(
    initial?.muscle_soreness?.toString() ?? "",
  );
  const [energyLevel, setEnergyLevel] = useState(
    initial?.energy_level?.toString() ?? "",
  );
  const [fatigue, setFatigue] = useState(
    clinical?.fatigue_perceived?.toString() ?? "",
  );
  const [efficiency, setEfficiency] = useState(
    clinical?.sleep_efficiency?.toString() ?? "",
  );
  const [painSegment, setPainSegment] = useState(clinical?.pain_segment ?? "");
  const [pain, setPain] = useState(clinical?.pain_nrs?.toString() ?? "");
  const [respiratory, setRespiratory] = useState(clinical?.respiratory ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
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
          fatiguePerceived: fatigue === "" ? null : Number(fatigue),
          sleepEfficiency: efficiency === "" ? null : Number(efficiency),
          painSegment: painSegment.trim() || null,
          painNrs: pain === "" ? null : Number(pain),
          respiratory: respiratory || null,
        }),
      });

      setLoading(false);
      if (!res.ok) {
        const { error } = await res
          .json()
          .catch(() => ({ error: "Error desconocido" }));
        toast.error(error);
        return;
      }
      toast.success("Evaluación de hoy guardada");
      onSaved?.();
      router.refresh();
    } catch {
      toast.error("No se pudo confirmar el guardado. Reintenta.");
    } finally {
      setLoading(false);
    }
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
        <Switch
          id="will-train"
          checked={willTrain}
          onCheckedChange={setWillTrain}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sleep-hours">Horas de sueño</Label>
          <Input
            id="sleep-hours"
            type="number"
            step="0.5"
            min="0"
            max="24"
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

      <fieldset
        className="grid grid-cols-2 gap-3 rounded-xl border p-3"
        disabled={loading}
      >
        <legend className="px-1 text-sm font-semibold">
          Control motor y síntomas · privado
        </legend>
        <p className="col-span-2 text-xs text-muted-foreground">
          Datos opcionales para tu seguimiento personal. La fatiga es percibida,
          no una medición del SNC. Estos campos no se comparten con el coach.
        </p>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fatigue-perceived">Fatiga percibida (0–10)</Label>
          <Input
            id="fatigue-perceived"
            type="number"
            min={0}
            max={10}
            step={1}
            value={fatigue}
            onChange={(e) => setFatigue(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sleep-efficiency">Eficiencia del sueño (%)</Label>
          <Input
            id="sleep-efficiency"
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={efficiency}
            onChange={(e) => setEfficiency(e.target.value)}
          />
          <small className="text-xs text-muted-foreground">
            Tiempo dormido / tiempo en cama × 100, estimado.
          </small>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pain-segment">Zona del dolor</Label>
          <Input
            id="pain-segment"
            maxLength={80}
            required={Number(pain) > 0}
            value={painSegment}
            onChange={(e) => setPainSegment(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pain-nrs">Dolor NRS (0–10)</Label>
          <Input
            id="pain-nrs"
            type="number"
            min={0}
            max={10}
            step={1}
            value={pain}
            onChange={(e) => setPain(e.target.value)}
          />
        </div>
        <div className="col-span-2 flex flex-col gap-1.5">
          <Label htmlFor="respiratory">Síntomas respiratorios</Label>
          <select
            id="respiratory"
            className="min-h-11 rounded-lg border bg-background px-3 text-sm"
            value={respiratory}
            onChange={(e) => setRespiratory(e.target.value)}
          >
            <option value="">Sin registrar</option>
            {["Sin síntomas", "Tos", "Disnea", "Otros"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Guardando..." : "Guardar evaluación de hoy"}
      </Button>
    </form>
  );
}
