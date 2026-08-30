"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImagePlusIcon } from "lucide-react";

interface ExerciseMediaDialogProps {
  exerciseId: string;
  exerciseName: string;
  initialThumbnailUrl: string | null;
  initialVideoUrl: string | null;
}

export function ExerciseMediaDialog({
  exerciseId,
  exerciseName,
  initialThumbnailUrl,
  initialVideoUrl,
}: ExerciseMediaDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState(initialThumbnailUrl ?? "");
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/exercises/${exerciseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        thumbnailUrl: thumbnailUrl.trim() || null,
        videoUrl: videoUrl.trim() || null,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Error desconocido" }));
      toast.error(error);
      return;
    }
    toast.success("Ejercicio actualizado");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm">
            <ImagePlusIcon />
            <span className="sr-only">Agregar miniatura y ejecución</span>
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{exerciseName}</DialogTitle>
          <DialogDescription>
            Pegá el link de una imagen de referencia y/o un video de la ejecución (por ejemplo, de
            YouTube). Quedan a tu criterio — no los completamos automáticamente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="thumbnail-url">Imagen (miniatura)</Label>
            <Input
              id="thumbnail-url"
              type="url"
              placeholder="https://..."
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="video-url">Video de ejecución</Label>
            <Input
              id="video-url"
              type="url"
              placeholder="https://youtube.com/..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
