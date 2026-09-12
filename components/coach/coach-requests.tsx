"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface PendingLink {
  id: string;
  coach_email: string | null;
}

export function CoachRequests({ links }: { links: PendingLink[] }) {
  const router = useRouter();
  const [respondingId, setRespondingId] = useState<string | null>(null);

  async function respond(linkId: string, status: "active" | "revoked") {
    setRespondingId(linkId);
    const res = await fetch(`/api/coach/links/${linkId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setRespondingId(null);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Error desconocido" }));
      toast.error(error);
      return;
    }
    toast.success(status === "active" ? "Coach aceptado" : "Invitación rechazada");
    router.refresh();
  }

  if (links.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {links.map((link) => (
        <div key={link.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
          <p className="text-sm">
            <span className="font-medium">{link.coach_email ?? "Un coach"}</span> te invitó a compartir tu
            progreso
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" disabled={respondingId === link.id} onClick={() => respond(link.id, "active")}>
              Aceptar
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={respondingId === link.id}
              onClick={() => respond(link.id, "revoked")}
            >
              Rechazar
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
