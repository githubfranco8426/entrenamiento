"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ExerciseBiomechanicsForm({
  exerciseId,
  initialCues,
  initialNotes,
}: {
  exerciseId: string;
  initialCues: string[] | null;
  initialNotes: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cuesText, setCuesText] = useState((initialCues ?? []).join("\n"));
  const [notes, setNotes] = useState(initialNotes ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const cues = cuesText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const res = await fetch(`/api/exercises/${exerciseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cues: cues.length > 0 ? cues : null,
        biomechanicsNotes: notes || null,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Error desconocido" }));
      toast.error(error);
      return;
    }
    toast.success("Detalle biomecánico guardado");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
