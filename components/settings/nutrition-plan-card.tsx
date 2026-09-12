"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileTextIcon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NutritionPlanCard({ url }: { url: string | null }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/documents/nutrition-plan", { method: "POST", body: formData });
    setUploading(false);

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Error desconocido" }));
      toast.error(error);
      return;
    }
    toast.success(url ? "Plan actualizado" : "Plan cargado");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted/60 p-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-card text-primary">
        <FileTextIcon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Plan nutricional</p>
        <p className="text-xs text-muted-foreground">
          {url ? "PDF cargado — el link de vista expira a los 10 min." : "Todavía no subiste tu plan."}
        </p>
      </div>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-sm text-primary underline underline-offset-2"
        >
          Ver
        </a>
      )}
      <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        aria-label={url ? "Reemplazar plan" : "Subir plan"}
      >
        <UploadIcon className="size-4" />
      </Button>
    </div>
  );
}
