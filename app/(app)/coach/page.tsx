import Link from "next/link";
import { UsersIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CoachInviteForm } from "@/components/coach/coach-invite-form";
import { RevokeLinkButton } from "@/components/coach/coach-link-actions";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  active: { label: "Activo", variant: "default" },
  pending: { label: "Pendiente", variant: "secondary" },
  revoked: { label: "Revocado", variant: "outline" },
};

export default async function CoachPage() {
  const supabase = await createClient();
  const { data: links } = await supabase
    .from("coach_athlete_links")
    .select("*")
    .order("created_at", { ascending: false });

  const active = (links ?? []).filter((l) => l.status === "active");
  const pending = (links ?? []).filter((l) => l.status === "pending");
  const revoked = (links ?? []).filter((l) => l.status === "revoked");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <UsersIcon className="size-5 text-secondary" />
        <div>
          <h1 className="font-heading text-lg font-semibold">Coach</h1>
          <p className="text-sm text-muted-foreground">
            Gestioná los atletas que compartieron su progreso con vos.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invitar atleta</CardTitle>
          <CardDescription>
            El atleta necesita tener una cuenta creada en la app con ese email. Va a ver tu invitación
            en Ajustes → Solicitudes de coach.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CoachInviteForm />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <h2 className="border-b border-border pb-2 font-heading text-base font-bold uppercase tracking-wide text-primary">
          Tus atletas
        </h2>
        {(links ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Todavía no invitaste a ningún atleta.</p>
        )}
        {[...active, ...pending, ...revoked].map((link) => (
          <div key={link.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium">{link.athlete_email ?? link.athlete_id}</p>
              <Badge variant={STATUS_LABELS[link.status].variant} className="mt-1">
                {STATUS_LABELS[link.status].label}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {link.status === "active" && (
                <Link
                  href={`/coach/athletes/${link.athlete_id}`}
                  className="text-sm font-medium text-primary underline underline-offset-2"
                >
                  Ver progreso
                </Link>
              )}
              {link.status !== "revoked" && <RevokeLinkButton linkId={link.id} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
