"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ExerciseBiomechanicsForm({
  exerciseId,
  exerciseName,
  muscleGroup,
  equipment,
  initialCues,
  initialNotes,
}: {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string | null;
  equipment: string | null;
  initialCues: string[] | null;
  initialNotes: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [cuesText, setCuesText] = useState((initialCues ?? []).join("\n"));
  const [notes, setNotes] = useState(initialNotes ?? "");

  async function saveDetails(cues: string[], biomechanicsNotes: string) {
    const res = await fetch(`/api/exercises/${exerciseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cues: cues.length > 0 ? cues : null,
        biomechanicsNotes: biomechanicsNotes || null,
      }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Error desconocido" }));
      toast.error(error);
      return false;
    }
    return true;
  }

  async function handleGenerate() {
    setGenerating(true);
    const res = await fetch("/api/ai/exercise-cues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exerciseName, muscleGroup, equipment }),
    });

    if (!res.ok) {
      setGenerating(false);
      const { error } = await res.json().catch(() => ({ error: "Error desconocido" }));
      toast.error(error);
      return;
    }
    const { cues, biomechanicsNotes } = await res.json();
    setCuesText(cues.join("\n"));
    setNotes(biomechanicsNotes);

    const saved = await saveDetails(cues, biomechanicsNotes);
    setGenerating(false);
    if (saved) {
      toast.success("Detalle biomecánico generado y guardado");
      router.refresh();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const cues = cuesText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const saved = await saveDetails(cues, notes);
    setLoading(false);
    if (saved) {
      toast.success("Detalle biomecánico guardado");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit gap-1.5"
        disabled={generating}
        onClick={handleGenerate}
      >
        <SparklesIcon className="size-3.5" />
        {generating ? "Generando..." : "Generar y guardar con IA"}
      </Button>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ex-cues">Puntos clave de ejecución (uno por línea)</Label>
        <Textarea
          id="ex-cues"
          rows={4}
          placeholder={"Espalda neutra durante todo el recorrido\nRodillas alineadas con la punta del pie\nExhalar en la fase concéntrica"}
          value={cuesText}
          onChange={(e) => setCuesText(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ex-biomechanics">Notas biomecánicas</Label>
        <Textarea
          id="ex-biomechanics"
          rows={4}
          placeholder="Patrón de movimiento, articulaciones y cadena cinética involucradas, contraindicaciones a considerar..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={loading} className="self-start">
        {loading ? "Guardando..." : "Guardar detalle biomecánico"}
      </Button>
    </form>
  );
}
