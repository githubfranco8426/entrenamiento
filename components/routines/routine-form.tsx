"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ExerciseForm } from "@/components/exercises/exercise-form";
import { PlusIcon, TrashIcon, ActivityIcon } from "lucide-react";

interface ExerciseOption {
  id: string;
  name: string;
}

interface ExerciseRow {
  exerciseId: string;
  sets: string;
  repsMin: string;
  repsMax: string;
  rpe: string;
}

const EMPTY_ROW: ExerciseRow = { exerciseId: "", sets: "3", repsMin: "8", repsMax: "10", rpe: "8" };

export function RoutineForm({ exercises: initialExercises }: { exercises: ExerciseOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [dayLabel, setDayLabel] = useState("");
  const [rows, setRows] = useState<ExerciseRow[]>([{ ...EMPTY_ROW }]);
  const [exercises, setExercises] = useState(initialExercises);
  const [creatingForRow, setCreatingForRow] = useState<number | null>(null);
  const exerciseItems = Object.fromEntries(exercises.map((ex) => [ex.id, ex.name]));

  function handleExerciseCreated(rowIndex: number, exercise: { id: string; name: string }) {
    setExercises((prev) => [...prev, exercise].sort((a, b) => a.name.localeCompare(b.name)));
    updateRow(rowIndex, { exerciseId: exercise.id });
    setCreatingForRow(null);
  }

  function updateRow(index: number, patch: Partial<ExerciseRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { ...EMPTY_ROW }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function resetForm() {
    setTitle("");
    setDayLabel("");
    setRows([{ ...EMPTY_ROW }]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validRows = rows.filter((r) => r.exerciseId);
    if (validRows.length === 0) {
      toast.error("Agregá al menos un ejercicio");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/routines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        dayLabel: dayLabel || null,
        exercises: validRows.map((r, index) => ({
          exerciseId: r.exerciseId,
          orderIndex: index,
          targetSets: Array.from({ length: Number(r.sets) || 1 }, (_, setIndex) => ({
            setIndex,
            targetRepsMin: r.repsMin ? Number(r.repsMin) : null,
            targetRepsMax: r.repsMax ? Number(r.repsMax) : null,
            targetRpe: r.rpe ? Number(r.rpe) : null,
          })),
        })),
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Error desconocido" }));
      toast.error(error);
      return;
    }

    toast.success("Rutina creada");
    resetForm();
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button><PlusIcon /> Nueva rutina</Button>} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva rutina</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="routine-title">Título</Label>
              <Input id="routine-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="routine-day">Día</Label>
              <Input
                id="routine-day"
                placeholder="Ej: Push"
                value={dayLabel}
                onChange={(e) => setDayLabel(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {rows.map((row, index) => (
              <div key={index} className="flex flex-col gap-2 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <Select
                    items={exerciseItems}
                    value={row.exerciseId}
                    onValueChange={(v) => updateRow(index, { exerciseId: v ?? "" })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Elegí un ejercicio" />
                    </SelectTrigger>
                    <SelectContent>
                      {exercises.map((ex) => (
                        <SelectItem key={ex.id} value={ex.id}>
                          {ex.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeRow(index)}
                    disabled={rows.length === 1}
                  >
                    <TrashIcon />
                  </Button>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setCreatingForRow(creatingForRow === index ? null : index)}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <PlusIcon className="size-3" />
                    {creatingForRow === index ? "Cancelar" : "No está en la lista — crear ejercicio"}
                  </button>
                  {row.exerciseId && (
                    <Link
                      href={`/exercises/${row.exerciseId}`}
                      target="_blank"
                      className="flex items-center gap-1 text-secondary hover:text-foreground"
                    >
                      <ActivityIcon className="size-3" />
                      Detalle biomecánico
                    </Link>
                  )}
                </div>

                {creatingForRow === index && (
                  <div className="rounded-lg border border-dashed border-border p-2.5">
                    <ExerciseForm compact onCreated={(ex) => handleExerciseCreated(index, ex)} />
                  </div>
                )}
                <div className="grid grid-cols-4 gap-2">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Sets</Label>
                    <Input
                      type="number"
                      min="1"
                      value={row.sets}
                      onChange={(e) => updateRow(index, { sets: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Reps min</Label>
                    <Input
                      type="number"
                      min="1"
                      value={row.repsMin}
                      onChange={(e) => updateRow(index, { repsMin: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Reps max</Label>
                    <Input
                      type="number"
                      min="1"
                      value={row.repsMax}
                      onChange={(e) => updateRow(index, { repsMax: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">RPE</Label>
                    <Input
                      type="number"
                      min="5"
                      max="10"
                      step="0.5"
                      value={row.rpe}
                      onChange={(e) => updateRow(index, { rpe: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              <PlusIcon /> Agregar ejercicio
            </Button>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear rutina"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
