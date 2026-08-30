"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ExerciseForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [equipment, setEquipment] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        muscleGroup: muscleGroup || undefined,
        equipment: equipment || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
        videoUrl: videoUrl || undefined,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Error desconocido" }));
      toast.error(error);
      return;
    }
    setName("");
    setMuscleGroup("");
    setEquipment("");
    setThumbnailUrl("");
    setVideoUrl("");
    toast.success("Ejercicio agregado");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ex-name">Nombre</Label>
        <Input id="ex-name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ex-muscle">Grupo muscular</Label>
        <Input
          id="ex-muscle"
          value={muscleGroup}
          onChange={(e) => setMuscleGroup(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ex-equipment">Equipo</Label>
        <Input
          id="ex-equipment"
          value={equipment}
          onChange={(e) => setEquipment(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ex-thumbnail">Imagen (opcional)</Label>
        <Input
          id="ex-thumbnail"
          type="url"
          placeholder="https://..."
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ex-video">Video ejecución (opcional)</Label>
        <Input
          id="ex-video"
          type="url"
          placeholder="https://youtube.com/..."
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Agregando..." : "Agregar ejercicio"}
      </Button>
    </form>
  );
}
