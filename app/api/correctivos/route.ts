import { correctiveAccess } from "@/lib/correctives/server";
import { localDay, mutationSchema } from "@/lib/correctives/model";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
type CorrectiveTable =
  | "corrective_baselines"
  | "corrective_plans"
  | "corrective_sessions"
  | "corrective_sets"
  | "readiness_clinical"
  | "readiness_logs";

export const dynamic = "force-dynamic";
const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
};
function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers });
}
async function rows(
  db: SupabaseClient<Database>,
  table: CorrectiveTable,
  user: string,
) {
  const all: Record<string, unknown>[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await db
      .from(table)
      .select("*")
      .eq("user_id", user)
      .order(
        table === "corrective_plans"
          ? "user_id"
          : table === "readiness_clinical"
            ? "log_date"
            : "id",
      )
      .range(offset, offset + 499);
    if (error) throw new Error("storage");
    all.push(...data);
    if (data.length < 500) return all;
  }
}
export async function GET(request: Request) {
  try {
    const { db, user } = await correctiveAccess();
    if (!user) return json({ error: "Inicia sesión para continuar." }, 401);
    const [baselines, plans, sessions, sets, clinicalCheckins, readinessLogs] =
      await Promise.all([
        rows(db, "corrective_baselines", user.id),
        rows(db, "corrective_plans", user.id),
        rows(db, "corrective_sessions", user.id),
        rows(db, "corrective_sets", user.id),
        rows(db, "readiness_clinical", user.id),
        rows(db, "readiness_logs", user.id),
      ]);
    const data = {
      userId: user.id,
      clinicalCheckins,
      readinessLogs,
      baseline: baselines.find((b) => b.day === localDay()) ?? null,
      baselines,
      plan: plans[0]?.plan ?? [],
      sessions: sessions.sort((a, b) =>
        String(b.started_at).localeCompare(String(a.started_at)),
      ),
      sets,
    };
    if (new URL(request.url).searchParams.get("export") === "json")
      return new Response(
        JSON.stringify(
          { version: 1, exportedAt: new Date().toISOString(), ...data },
          null,
          2,
        ),
        {
          headers: {
            ...headers,
            "Content-Type": "application/json; charset=utf-8",
            "Content-Disposition":
              'attachment; filename="ejercicios-correctivos.json"',
          },
        },
      );
    return json(data);
  } catch {
    return json(
      {
        error:
          "Correctivos no está disponible. Comprueba la conexión y que su migración esté aplicada; después reintenta.",
      },
      503,
    );
  }
}
export async function POST(request: Request) {
  // Reject cross-site writes before reading health data. No wildcard CORS.
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return json({ error: "Origen no permitido." }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return json({ error: "Formato inválido." }, 415);
  if (Number(request.headers.get("content-length") ?? 0) > 32000)
    return json({ error: "Registro demasiado grande." }, 413);
  try {
    const { db, user } = await correctiveAccess();
    if (!user)
      return json(
        { error: "Tu sesión expiró. Vuelve a ingresar antes de reintentar." },
        401,
      );
    const body = await request.text();
    if (body.length > 32000)
      return json({ error: "Registro demasiado grande." }, 413);
    let input: unknown;
    try {
      input = JSON.parse(body);
    } catch {
      return json({ error: "JSON inválido." }, 400);
    }
    const parsed = mutationSchema.safeParse(input);
    if (!parsed.success)
      return json(
        { error: parsed.error.issues[0]?.message ?? "Revisa los valores." },
        400,
      );
    const m = parsed.data;
    let result;
    if (m.op === "baseline") {
      if (m.data.day !== localDay())
        return json(
          { error: "La evaluación debe corresponder a hoy (Chile)." },
          400,
        );
      result = await db
        .from("corrective_baselines")
        .upsert({ ...m.data, user_id: user.id }, { onConflict: "user_id,day" })
        .select()
        .single();
    } else if (m.op === "plan") {
      result = await db
        .from("corrective_plans")
        .upsert({
          user_id: user.id,
          plan: m.data,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
    } else if (m.op === "start") {
      result = await db.rpc("corrective_start", {
        p_id: m.id,
        p_baseline: m.baselineId,
      });
    } else if (m.op === "set") {
      result = await db.rpc("corrective_log_set", { p: m.data });
    } else {
      result = await db
        .from("corrective_sessions")
        .update({ status: "completed", ended_at: new Date().toISOString() })
        .eq("id", m.id)
        .eq("user_id", user.id)
        .eq("status", "active")
        .select();
    }
    if (result.error)
      return json(
        {
          error:
            "No se guardó el cambio. Revisa si la sesión ya terminó o si la serie existe; actualiza y reintenta.",
        },
        409,
      );
    return json({ ok: true, data: result.data });
  } catch {
    return json(
      {
        error:
          "No pudimos confirmar el guardado. Conserva la pantalla y reintenta.",
      },
      503,
    );
  }
}
