import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  if (request.nextUrl.pathname.startsWith("/correctivos")) {
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set("Referrer-Policy", "no-referrer");
    response.headers.set("X-Frame-Options", "DENY");
  }
  return response;
}

export const config = {
  // Excluye /api: cada route handler ya crea su propio cliente de Supabase (lib/supabase/server.ts)
  // y las policies de RLS protegen los datos igual sin pasar por acá. Correr este middleware —que
  // hace un round-trip a Supabase Auth con auth.getUser()— en cada POST/DELETE de la UI (registrar
  // set, iniciar/cancelar entrenamiento, etc.) sumaba ~150-500ms fijos a cada click, sin aportar
  // protección real ya que esas llamadas son fetch() y no siguen redirects HTML.
  matcher: [
    "/((?!offline-workout|api|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
