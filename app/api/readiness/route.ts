import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/supabase/get-authenticated-user";
import { checkinPayload, checkinSchema } from "@/lib/readiness/model";

const headers = { "Cache-Control": "private, no-store, max-age=0" };
function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers });
}
export async function GET(request: Request) {
  try {
    const db = await createClient();
    const user = await getAuthenticatedUser(db);
    if (!user) return json({ error: "No autenticado" }, 401);
    const raw = Number(new URL(request.url).searchParams.get("days") ?? 14);
    const days = Number.isFinite(raw)
      ? Math.max(1, Math.min(365, Math.floor(raw)))
      : 14;
    const { data, error } = await db
      .from("readiness_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("log_date", { ascending: false })
      .limit(days);
    if (error)
      return json({ error: "No se pudo cargar tu chequeo diario." }, 503);
    return json({ readinessLogs: data });
  } catch {
    return json({ error: "No se pudo cargar tu chequeo diario." }, 503);
  }
}
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return json({ error: "Origen no permitido." }, 403);
  try {
    const db = await createClient();
    const user = await getAuthenticatedUser(db);
    if (!user) return json({ error: "No autenticado" }, 401);
    const text = await request.text();
    if (text.length > 24000)
      return json({ error: "Registro demasiado grande." }, 413);
    let input: unknown;
    try {
      input = JSON.parse(text);
    } catch {
      return json({ error: "Formato inválido." }, 400);
    }
    const parsed = checkinSchema.safeParse(input);
    if (!parsed.success)
      return json(
        { error: parsed.error.issues[0]?.message ?? "Revisa los valores." },
        400,
      );
    const { data, error } = await db.rpc("save_daily_checkin", {
      p: checkinPayload(parsed.data),
    });
    if (error)
      return json(
        {
          error:
            "No se guardó la evaluación. Revisa los datos y vuelve a intentar.",
        },
        409,
      );
    return json({ readinessLog: data });
  } catch {
    return json({ error: "No pudimos confirmar el guardado. Reintenta." }, 503);
  }
}
