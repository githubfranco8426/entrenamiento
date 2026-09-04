"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ImagesIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProgressPhoto {
  date: string;
  weightKg: number | null;
  bodyFatPct: number | null;
  url: string | null;
}

export function ProgressPhotoGallery({ photos }: { photos: ProgressPhoto[] }) {
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const usable = photos.filter((p) => p.url != null);

  function toggleCompare(date: string) {
    setCompareIds((prev) => {
      if (prev.includes(date)) return prev.filter((d) => d !== date);
      if (prev.length >= 2) return [prev[1], date];
      return [...prev, date];
    });
  }

  if (usable.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no subiste ninguna foto de progreso. Podés hacerlo desde el Panel, junto al peso del día.
      </p>
    );
  }

  const compared = compareIds
    .map((d) => usable.find((p) => p.date === d))
    .filter((p): p is ProgressPhoto => !!p)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="flex flex-col gap-4">
      {compared.length === 2 && (
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            <ImagesIcon className="size-3.5" />
            Comparando
          </p>
          <div className="grid grid-cols-2 gap-2">
            {compared.map((p) => (
              <PhotoCard key={p.date} photo={p} large />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {usable.map((p) => (
          <button
            key={p.date}
            type="button"
            onClick={() => toggleCompare(p.date)}
            className={cn(
              "overflow-hidden rounded-lg ring-2 transition-colors",
              compareIds.includes(p.date) ? "ring-primary" : "ring-transparent",
            )}
          >
            <PhotoCard photo={p} />
          </button>
        ))}
      </div>
      <p className="text-center text-[11px] text-muted-foreground">
        Tocá hasta 2 fotos para compararlas lado a lado
      </p>
    </div>
  );
}

function PhotoCard({ photo, large }: { photo: ProgressPhoto; large?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada de Supabase Storage con expiración corta */}
      <img
        src={photo.url ?? undefined}
        alt={`Progreso del ${photo.date}`}
        className={cn("w-full rounded-lg object-cover", large ? "aspect-[3/4]" : "aspect-square")}
      />
      <div className="flex items-center justify-between px-0.5">
        <span className="font-mono text-[10px] text-muted-foreground">
          {format(new Date(photo.date), "dd/MM/yy", { locale: es })}
        </span>
        {photo.weightKg != null && (
          <span className="font-mono text-[10px] text-secondary">{photo.weightKg}kg</span>
        )}
      </div>
    </div>
  );
}
