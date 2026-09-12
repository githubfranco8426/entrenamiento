import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/supabase/get-authenticated-user";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const email = (body.email as string | undefined)?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Ingresá un email" }, { status: 400 });

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor — no se puede resolver el email a una cuenta." },
      { status: 500 },
    );
  }

  let athlete: { id: string; email?: string } | null = null;
  try {
    const admin = createAdminClient();
    // La API admin no tiene "getUserByEmail" directo — se pagina y filtra.
    // Suficiente para el volumen esperado (un coach con un puñado de atletas).
    for (let page = 1; page <= 20 && !athlete; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      athlete = data.users.find((u) => u.email?.toLowerCase() === email) ?? null;
      if (data.users.length < 200) break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido resolviendo el email";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (!athlete) {
    return NextResponse.json(
      { error: "No encontramos una cuenta con ese email. El atleta primero necesita crearse una cuenta en la app." },
      { status: 404 },
    );
  }
  if (athlete.id === user.id) {
    return NextResponse.json({ error: "No podés invitarte a vos mismo" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("coach_athlete_links")
    .select("status")
    .eq("coach_id", user.id)
    .eq("athlete_id", athlete.id)
    .maybeSingle();
  if (existing?.status === "active") {
    return NextResponse.json({ error: "Ya tenés un vínculo activo con este atleta" }, { status: 409 });
  }

  const { data: link, error: linkError } = await supabase
    .from("coach_athlete_links")
    .upsert(
      {
        coach_id: user.id,
        athlete_id: athlete.id,
        athlete_email: athlete.email ?? email,
        coach_email: user.email ?? null,
        status: "pending",
        invited_at: new Date().toISOString(),
      },
      { onConflict: "coach_id,athlete_id" },
    )
    .select()
    .single();

  if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 });
  return NextResponse.json({ link }, { status: 201 });
}
