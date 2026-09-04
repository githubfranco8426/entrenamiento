"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CameraIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function BodyMetricForm({
  today,
  initial,
}: {
  today: string;
  initial: { weight_kg: number | null; body_fat_pct: number | null; photo_path: string | null } | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [weightKg, setWeightKg] = useState(initial?.weight_kg?.toString() ?? "");
  const [bodyFatPct, setBodyFatPct] = useState(initial?.body_fat_pct?.toString() ?? "");
  const [photoPath, setPhotoPath] = useState<string | null>(initial?.photo_path ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadingPhoto(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setUploadingPhoto(false);
      toast.error("No autenticado");
      return;
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${today}.${ext}`;
    const { error } = await supabase.storage
      .from("progress-photos")
      .upload(path, file, { upsert: true, contentType: file.type });

    setUploadingPhoto(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPhotoPath(path);
    toast.success("Foto subida");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/body-metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        logDate: today,
        weightKg: weightKg ? Number(weightKg) : null,
        bodyFatPct: bodyFatPct ? Number(bodyFatPct) : null,
        photoPath,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Error desconocido" }));
      toast.error(error);
      return;
    }
    toast.success("Métricas guardadas");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="weight">Peso (kg)</Label>
        <Input
          id="weight"
          type="number"
          step="0.1"
          value={weightKg}
          onChange={(e) => setWeightKg(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bodyfat">% Grasa</Label>
        <Input
          id="bodyfat"
          type="number"
          step="0.1"
          value={bodyFatPct}
          onChange={(e) => setBodyFatPct(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Foto</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoChange}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={uploadingPhoto}
          onClick={() => fileInputRef.current?.click()}
          aria-label={photoPath ? "Cambiar foto" : "Subir foto"}
        >
          <CameraIcon className={photoPath ? "text-primary" : undefined} />
        </Button>
      </div>
      <Button type="submit" disabled={loading || uploadingPhoto}>
        {loading ? "Guardando..." : "Guardar"}
      </Button>
    </form>
  );
}
