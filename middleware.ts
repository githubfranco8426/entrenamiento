import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Excluye /api: cada route handler ya crea su propio cliente de Supabase (lib/supabase/server.ts)
  // y las policies de RLS protegen los datos igual sin pasar por acá. Correr este middleware —que
  // hace un round-trip a Supabase Auth con auth.getUser()— en cada POST/DELETE de la UI (registrar
  // set, iniciar/cancelar entrenamiento, etc.) sumaba ~150-500ms fijos a cada click, sin aportar
  // protección real ya que esas llamadas son fetch() y no siguen redirects HTML.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
