import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/supabase/get-authenticated-user";
import { publishRecords, trainingSeed } from "@/lib/opengym/bridge";
import { StateSchema, type OpenGymState } from "@/lib/opengym/state";
import { propose } from "@/lib/opengym/coach";
import type { Json } from "@/lib/types/database";

export const maxDuration = 120;
type Context = { params: Promise<{ path: string[] }> };
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

async function handle(request: Request, context: Context) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) return reply({ error: "Inicia sesión en Entrenamiento." }, 401);
  const account = request.headers.get("x-opengym-account");
  if (account && account !== user.id) return reply({ error:"La cuenta cambió. Vuelve a abrir OpenGym." },409);
  // Cookie-authenticated mutations must originate from this application.
  if (request.method !== "GET" && request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) return reply({ error: "Origen no permitido" }, 403);
  const route = (await context.params).path.join("/");
  const method = request.method;
  const enabled = Boolean(process.env.GEMINI_API_KEY);
  if (method === "GET" && route === "me") return reply({ user: { id:user.id, name:user.email ?? "Atleta", admin:false } });
  if (method === "GET" && route === "config") return reply({ coach:{ enabled }, invite_only:true });
  if (method === "POST" && (route === "logout" || route === "logout/all")) {
    const { error } = await supabase.auth.signOut({ scope: route === "logout/all" ? "global" : "local" });
    return error ? reply({ error:"No se pudo cerrar sesión" },500) : reply({ ok:true });
  }
  if (method === "GET" && route === "coach/disclosure") return reply({ provider:"gemini", providerLabel:"Google Gemini", categories:["plan","training","bodyweight","profile","prefs"], version:1 });
  const { data:profile, error:profileError } = await supabase.from("opengym_profiles").select("*").eq("user_id",user.id).maybeSingle();
  if (profileError) return reply({ error:"No se pudo abrir OpenGym. Verifica que su migración de base de datos esté aplicada." },503);
  const save = async (state: OpenGymState, revision: number) => {
    const { data, error } = await supabase.rpc("save_opengym_state", { p_state:state as Json, p_revision:revision });
    if (error) throw Object.assign(new Error(error.code === "40001" ? "Hay cambios en otro dispositivo. Exporta tu copia local desde Ajustes antes de recargar y reintentar." : "No se pudo guardar OpenGym."), { status:error.code === "40001" ? 409 : 500 });
    return data;
  };
  try {
    if (method === "GET" && route === "data") {
      if (profile && Object.keys(profile.state as object).length) return reply({ state:profile.state, revision:profile.revision });
      const state = await trainingSeed(supabase,user.id);
      const revision = await save(state,profile?.revision ?? 0);
      return reply({ state, revision });
    }
    if (method === "GET" && route === "coach/status") return reply({ job:null, pending:profile?.coach_pending ?? null, cap:null });
    if (method === "POST" && ["coach/pending/resolve","coach/forget"].includes(route)) {
      const { error } = await supabase.from("opengym_profiles").update({ coach_pending:null }).eq("user_id",user.id);
      if (error) throw new Error("No se pudo cerrar la propuesta.");
      return reply({ ok:true });
    }
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 4*1024*1024) return reply({ error:"El archivo supera 4 MB." },413);
    const body = raw ? JSON.parse(raw) : {};
    if (method === "PUT" && route === "data") {
      const parsed = StateSchema.safeParse(body.state);
      if (!parsed.success) return reply({ error:"Los datos de OpenGym no tienen un formato válido." },400);
      const match = request.headers.get("if-match");
      if (match === null || !/^\d+$/.test(match)) return reply({ error:"Falta la revisión de sincronización. Recarga OpenGym." },428);
      const revision = await save(parsed.data,Number(match));
      return reply({ ok:true,revision });
    }
    if (!profile) return reply({ error:"Abre OpenGym antes de transferir datos." },409);
    const state = StateSchema.parse(profile.state);
    if (method === "POST" && route === "bridge/import") {
      const seed = await trainingSeed(supabase,user.id);
      const published = profile.published_ids as Record<string,string[]>;
      for (const field of ["routines","workouts","bodyweight","customEx"] as const) {
        const ids = new Set(state[field].map(r=>r.id));
        const table = { routines:"routines",workouts:"workouts",bodyweight:"body_metrics",customEx:"exercises" }[field];
        const newRows = seed[field].filter(r=>!ids.has(r.id) && !(published[table] ?? []).includes((r.id ?? "").replace("training:","")));
        // Each array keeps its original validated element shape.
        (state[field] as unknown[]).push(...newRows);
      }
      state._trainingBase = { ...(seed._trainingBase as object), ...(state._trainingBase as object) };
      state._ts = Date.now();
      const revision = await save(state,profile.revision);
      return reply({ state,revision,message:"Datos añadidos desde Entrenamiento. Las rutinas ya importadas conservan tus ediciones en OpenGym." });
    }
    if (method === "POST" && route === "bridge/publish") {
      const records = publishRecords(state,user.id);
      const { data, error } = await supabase.rpc("publish_opengym",{ p_records:records as Json });
      if (error) throw new Error("No se pudo publicar. No se aplicó la transferencia; tus datos siguen en OpenGym.");
      return reply({ counts:data,message:"Publicado: encontrarás las copias de tus rutinas y sesiones en Entrenamiento. Los datos por tiempo y cardio se conservan completos en OpenGym." });
    }
    if (method === "POST" && ["coach/plan","coach/review"].includes(route)) {
      if (!enabled) return reply({ error:"Configura GEMINI_API_KEY para activar el entrenador." },503);
      const coach = state.coach as { consent?:{ version?:number; agreedAt?:number } } | null;
      if (!coach?.consent?.agreedAt || coach.consent.version !== 1) return reply({ error:"Activa el consentimiento del entrenador antes de continuar." },403);
      // Reserve a request slot atomically, across Vercel instances.
      const cutoff = new Date(Date.now()-120000).toISOString();
      const { data:reserved, error } = await supabase.from("opengym_profiles").update({ coach_last_requested_at:new Date().toISOString() }).eq("user_id",user.id).or(`coach_last_requested_at.is.null,coach_last_requested_at.lt.${cutoff}`).select("user_id").maybeSingle();
      if (error || !reserved) return reply({ error:"Espera dos minutos antes de pedir otra propuesta." },429);
      const previous = profile.coach_pending as { bundle?:unknown } | null;
      const pending = await propose(state,user.id,route === "coach/review" ? "review" : "create",body,previous?.bundle);
      const { error:pendingError } = await supabase.from("opengym_profiles").update({ coach_pending:pending as Json }).eq("user_id",user.id).eq("revision",profile.revision).select("user_id").single();
      if (pendingError) return reply({ error:"Tu plan cambió durante la revisión. Solicita una propuesta nueva." },409);
      return reply({ pending,job:null });
    }
    return reply({ error:"Esta función corresponde al servidor independiente de OpenGym; tu sesión se administra desde Entrenamiento." },404);
  } catch (error) {
    return reply({ error:error instanceof Error ? error.message : "No se pudo completar la operación." }, (error as {status?:number})?.status ?? 400);
  }
}
export { handle as GET, handle as POST, handle as PUT };
