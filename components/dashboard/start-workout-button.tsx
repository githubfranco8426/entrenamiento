"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function StartWorkoutButton({
  routineId,
  className,
  size = "sm",
  label = "Iniciar",
}: {
  routineId?: string;
  className?: string;
  size?: "sm" | "default" | "lg";
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ routineId: routineId ?? null }),
    });
    setLoading(false);

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Error desconocido" }));
      toast.error(error);
      return;
    }
    const { workout } = await res.json();
    router.push(`/workouts/${workout.id}`);
  }

  return (
    <Button size={size} className={className} onClick={handleClick} disabled={loading}>
      {loading ? "Iniciando..." : label}
    </Button>
  );
}
