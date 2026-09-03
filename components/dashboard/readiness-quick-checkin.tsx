"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BatteryMedium, Moon, Dumbbell, Sparkles, ChevronDown } from "lucide-react";
import { willTrainByDefault } from "@/lib/utils/shift-pattern";
import { ReadinessForm } from "@/components/dashboard/readiness-form";
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

const ENERGY_OPTIONS = [
  { label: "Baja", value: 2 },
  { label: "Media", value: 3 },
  { label: "A tope", value: 5 },
] as const;

function sleepVerdict(hours: number | null): string {
  if (hours == null) return "Sin registrar";
  if (hours >= 7) return "😴 Reparador";
  if (hours >= 5.5) return "🙂 Aceptable";
  return "⚠️ Corto";
}

function sorenessVerdict(level: number | null): string {
  if (level == null) return "Sin registrar";
  if (level <= 2) return "💪 Fresco";
  if (level <= 3) return "🙂 Liviano";
  return "🔥 Cargado";
}

export function ReadinessQuickCheckin({
  today,
  defaultShiftType,
  initial,
  aiNote,
}: {
  today: string;
  defaultShiftType: ShiftType;
  initial: ReadinessLogData | null;
  /** Frase corta mostrando cómo el próximo entrenamiento se ajusta a este check-in (opcional). */
  aiNote?: string | null;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);
  const [energyLevel, setEnergyLevel] = useState(initial?.energy_level ?? null);

  async function setEnergy(value: number) {
    setSaving(value);
    const res = await fetch("/api/readiness", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        logDate: today,
        shiftType: initial?.shift_type ?? defaultShiftType,
        willTrain: initial?.will_train ?? willTrainByDefault(defaultShiftType),
        sleepHours: initial?.sleep_hours ?? null,
        sleepQuality: initial?.sleep_quality ?? null,
        stressLevel: initial?.stress_level ?? null,
        muscleSoreness: initial?.muscle_soreness ?? null,
        energyLevel: value,
        notes: initial?.notes ?? null,
      }),
    });
    setSaving(null);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Error desconocido" }));
      toast.error(error);
      return;
    }
    setEnergyLevel(value);
    toast.success("Nivel de energía guardado");
    router.refresh();
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="size-[22px] text-secondary" />
          <h2 className="font-heading text-headline-md font-bold">¿Cómo te sentís hoy?</h2>
        </div>
        <span className="text-xs text-muted-foreground">Paso rápido</span>
      </div>

      <div className="flex flex-col gap-1.5 rounded-lg bg-muted/60 p-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            <BatteryMedium className="size-[15px] text-primary" />
            Nivel de batería
          </span>
          <span className="font-heading text-sm font-semibold text-primary">
            {energyLevel != null ? `${energyLevel}/5` : "Sin registrar"}
          </span>
        </div>
        <div className="flex gap-2 pt-1">
          {ENERGY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={saving !== null}
              onClick={() => setEnergy(opt.value)}
              className={cn(
                "flex-1 rounded-lg py-2 text-sm font-medium transition-all disabled:opacity-60",
                energyLevel === opt.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1 rounded-lg bg-muted/60 p-3">
          <span className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            <Moon className="size-[15px] text-secondary" />
            Descanso
          </span>
          <span className="font-heading text-sm font-semibold">
            {initial?.sleep_hours != null ? `${initial.sleep_hours}h` : "—"}
          </span>
          <span className="text-xs text-secondary">{sleepVerdict(initial?.sleep_hours ?? null)}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg bg-muted/60 p-3">
          <span className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            <Dumbbell className="size-[15px] text-primary" />
            Cuerpo
          </span>
          <span className="font-heading text-sm font-semibold">
            {initial?.muscle_soreness != null ? `Dolor ${initial.muscle_soreness}/5` : "—"}
          </span>
          <span className="text-xs text-primary">{sorenessVerdict(initial?.muscle_soreness ?? null)}</span>
        </div>
      </div>

      {aiNote && (
        <div className="flex items-start gap-3 rounded-lg bg-accent/60 p-3.5">
          <Sparkles className="mt-0.5 size-[18px] shrink-0 text-primary" />
          <p className="text-sm">{aiNote}</p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center justify-center gap-1 py-1 text-xs text-muted-foreground hover:text-foreground"
      >
        {expanded ? "Ocultar formulario completo" : "Ver formulario completo (sueño, estrés, notas)"}
        <ChevronDown className={cn("size-3.5 transition-transform", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <div className="border-t border-border pt-3">
          <ReadinessForm today={today} defaultShiftType={defaultShiftType} initial={initial} />
        </div>
      )}
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-gutter-md rounded-xl bg-card p-container-padding ring-1 ring-border">{children}</div>;
}
