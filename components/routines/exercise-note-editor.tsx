"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PencilIcon, ActivityIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/**
 * Nota técnica/biomecánica por ejercicio (ej. "codos cerca del torso", "no hiperextender
 * lumbar") — reusa routine_exercises.notes, ya visible durante la sesión de entreno en
 * ExerciseBlockCard. Esto le da al atleta una forma de escribirla desde Rutinas.
 */
export function ExerciseNoteEditor({ routineExerciseId, initialNotes }: { routineExerciseId: string; initialNotes: string | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/routine-exercises/${routineExerciseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: notes.trim() || null }),
    });
    setSaving(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Error desconocido" }));
      toast.error(error);
      return;
    }
    setEditing(false);
    toast.success("Nota guardada");
    router.refresh();
  }

  if (editing) {
    return (
      <div className="mt-1.5 flex flex-col gap-1.5 pl-7">
        <Textarea
          rows={2}
          autoFocus
          placeholder="Ej: codos cerca del torso, no hiperextender lumbar..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="flex gap-1.5 self-end">
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>
    );
  }

  if (initialNotes) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="ml-7 mt-1.5 flex items-start gap-1.5 text-left text-xs text-secondary hover:text-foreground"
      >
        <ActivityIcon className="mt-0.5 size-3.5 shrink-0" />
        {initialNotes}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="ml-7 mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
    >
      <PencilIcon className="size-3.5" /> Agregar nota técnica
    </button>
  );
}
