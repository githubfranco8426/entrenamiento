"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteButton({
  endpoint,
  confirmMessage,
  successMessage,
  size = "icon-sm",
}: {
  endpoint: string;
  confirmMessage: string;
  successMessage: string;
  size?: "icon-sm" | "icon-xs" | "sm";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!window.confirm(confirmMessage)) return;
    setLoading(true);
    const res = await fetch(endpoint, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Error desconocido" }));
      toast.error(error);
      return;
    }
    toast.success(successMessage);
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size={size}
      disabled={loading}
      onClick={handleDelete}
      aria-label="Borrar"
    >
      <Trash2Icon />
    </Button>
  );
}
