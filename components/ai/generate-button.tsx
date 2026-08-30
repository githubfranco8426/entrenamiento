"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SparklesIcon } from "lucide-react";

export function GenerateButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch("/api/ai/generate-microcycle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ triggerType: "manual" }),
    });
    setLoading(false);

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Error desconocido" }));
      toast.error(error);
      return;
    }
    toast.success("Propuesta generada");
    router.refresh();
  }

  return (
    <Button onClick={handleClick} disabled={loading}>
      <SparklesIcon /> {loading ? "Generando..." : "Generar propuesta"}
    </Button>
  );
}
