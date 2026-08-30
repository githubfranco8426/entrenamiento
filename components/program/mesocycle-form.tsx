"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusIcon } from "lucide-react";
import type { MesocyclePhase } from "@/lib/types/database";

const PHASE_LABELS: Record<MesocyclePhase, string> = {
  acumulacion: "Acumulación",
  intensificacion: "Intensificación",
  deload: "Deload",
  realizacion: "Realización",
};

export function MesocycleForm({
  macrocycleId,
  nextOrderIndex,
}: {
  macrocycleId: string;
  nextOrderIndex: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [phase, setPhase] = useState<MesocyclePhase>("acumulacion");
  const [plannedWeeks, setPlannedWeeks] = useState("4");
  const [activate, setActivate] = useState(true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/mesocycles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        macrocycleId,
        name,
        phase,
        orderIndex: nextOrderIndex,
        plannedWeeks: Number(plannedWeeks) || 4,
        activate,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Error desconocido" }));
      toast.error(error);
      return;
    }
    toast.success("Mesociclo creado");
    setName("");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline"><PlusIcon /> Nuevo mesociclo</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo mesociclo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meso-name">Nombre</Label>
            <Input id="meso-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Fase</Label>
            <Select
              items={PHASE_LABELS}
              value={phase}
              onValueChange={(v) => setPhase((v as MesocyclePhase) ?? "acumulacion")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PHASE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meso-weeks">Semanas planificadas</Label>
            <Input
              id="meso-weeks"
              type="number"
              min="1"
              value={plannedWeeks}
              onChange={(e) => setPlannedWeeks(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <Label htmlFor="meso-activate">Activar ahora (crea la semana 1)</Label>
            <Switch id="meso-activate" checked={activate} onCheckedChange={setActivate} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear mesociclo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
