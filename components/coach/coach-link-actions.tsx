"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function RevokeLinkButton({ linkId }: { linkId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRevoke() {
    if (!window.confirm("¿Revocar este vínculo? El atleta dejará de compartir sus datos con vos.")) return;
    setLoading(true);
    const res = await fetch(`/api/coach/links/${linkId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "revoked" }),
    });
    setLoading(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Error desconocido" }));
      toast.error(error);
      return;
    }
    toast.success("Vínculo revocado");
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={handleRevoke} disabled={loading}>
      {loading ? "..." : "Revocar"}
    </Button>
  );
}
