"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BatteryLow, BatteryMedium, ClipboardPenLine, HeartPulse, MoonStar, Sparkles, Zap } from "lucide-react";
import { willTrainByDefault } from "@/lib/utils/shift-pattern";
import { ReadinessForm } from "@/components/dashboard/readiness-form";
import { StatRing } from "@/components/dashboard/stat-ring";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  { label: "Voy suave", hint: "Poca energía", value: 2, icon: BatteryLow },
  { label: "Estoy bien", hint: "Energía estable", value: 3, icon: BatteryMedium },
  { label: "Me siento fuerte", hint: "Listo para dar más", value: 5, icon: Zap },
] as const;

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
  const [detailsOpen, setDetailsOpen] = useState(false);
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
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-secondary/25 bg-secondary/10 text-secondary shadow-[0_8px_20px_-14px_rgba(167,139,250,.75)]">
            <HeartPulse className="size-5" />
          </div>
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">Bienestar · check-in diario</p>
            <h2 className="mt-1 font-heading text-xl font-bold tracking-tight">Tu pulso de hoy</h2>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">Contanos cómo venís y ajustamos la sesión a tu realidad.</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-primary/20 bg-primary/8 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-primary">20 seg</span>
      </div>

      <section className="overflow-hidden rounded-2xl border border-primary/15 bg-[linear-gradient(120deg,rgba(0,242,254,.10),rgba(16,24,39,.92)_42%,rgba(167,139,250,.09))] p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
              <BatteryMedium className="size-3.5" />
              Energía disponible
            </p>
            <p className="mt-1 text-sm text-foreground">¿Con cuánto te gustaría encarar el entrenamiento?</p>
          </div>
          <span className="font-mono text-xs font-bold text-primary">
            {energyLevel != null ? `${energyLevel}/5` : "—"}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {ENERGY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={saving !== null}
              onClick={() => setEnergy(opt.value)}
              className={cn(
                "group flex min-h-20 flex-col items-start justify-between rounded-xl border p-2.5 text-left transition-all disabled:opacity-60",
                energyLevel === opt.value
                  ? "border-primary bg-primary text-primary-foreground shadow-[0_10px_22px_-14px_rgba(0,242,254,.9)]"
                  : "border-white/8 bg-background/45 text-muted-foreground hover:-translate-y-0.5 hover:border-primary/35 hover:text-foreground",
              )}
            >
              <opt.icon className={cn("size-4", energyLevel === opt.value ? "text-primary-foreground" : "text-secondary")} />
              <span className="text-xs font-semibold leading-tight">{opt.label}</span>
              <span className={cn("text-[10px] leading-tight", energyLevel === opt.value ? "text-primary-foreground/75" : "text-muted-foreground")}>{opt.hint}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-background/30 p-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary"><MoonStar className="size-4" /></div>
          <StatRing size={58} strokeWidth={5} pct={initial?.sleep_hours != null ? Math.min(100, (initial.sleep_hours / 9) * 100) : 0} value={initial?.sleep_hours != null ? `${initial.sleep_hours}h` : "—"} label="Descanso" color="var(--secondary)" />
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-background/30 p-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><HeartPulse className="size-4" /></div>
          <StatRing size={58} strokeWidth={5} pct={initial?.muscle_soreness != null ? (1 - (initial.muscle_soreness - 1) / 4) * 100 : 0} value={initial?.muscle_soreness != null ? `${initial.muscle_soreness}/5` : "—"} label="Cuerpo" color="var(--primary)" />
        </div>
      </div>

      {aiNote && (
        <div className="flex items-start gap-3 rounded-xl border border-secondary/15 bg-secondary/7 p-3.5">
          <Sparkles className="mt-0.5 size-[18px] shrink-0 text-primary" />
          <div className="flex min-w-0 flex-col gap-0.5">
            {!initial && (
              <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-secondary">
                Tu sesión se adapta a vos
              </span>
            )}
            <p className="text-sm">{aiNote}</p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setDetailsOpen(true)}
        className="flex items-center justify-center gap-2 rounded-xl border border-white/8 bg-background/30 px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/8 hover:text-foreground"
      >
        <ClipboardPenLine className="size-4 text-primary" />
        Completar mi bienestar
      </button>
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto border border-border bg-[#101827] p-5 sm:max-w-md">
          <DialogHeader className="pr-8">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary">Bienestar diario</p>
            <DialogTitle className="text-xl font-bold">Completá tu pulso de hoy</DialogTitle>
            <DialogDescription>Unos datos más nos permiten ajustar mejor el entrenamiento.</DialogDescription>
          </DialogHeader>
          <ReadinessForm today={today} defaultShiftType={defaultShiftType} initial={initial} />
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden flex flex-col gap-gutter-md rounded-2xl border border-border bg-card p-container-padding shadow-[0_18px_38px_-28px_rgba(0,0,0,.95)]">
      {children}
    </div>
  );
}
