import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/supabase/get-authenticated-user";

const BUCKET = "documents";
const SIGNED_URL_TTL_SECONDS = 60 * 10;

function pathFor(userId: string) {
  return `${userId}/plan-nutricional.pdf`;
}

async function ensureBucket(admin: ReturnType<typeof createAdminClient>) {
  const { error } = await admin.storage.createBucket(BUCKET, { public: false });
  // "already exists" es el camino esperado en cada llamada después de la primera.
  if (error && !error.message.toLowerCase().includes("already exists")) throw error;
}

export async function GET() {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(pathFor(user.id), SIGNED_URL_TTL_SECONDS);

  if (error) return NextResponse.json({ url: null });
  return NextResponse.json({ url: data.signedUrl });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || file.type !== "application/pdf") {
    return NextResponse.json({ error: "Subí un archivo PDF" }, { status: 400 });
  }

  const admin = createAdminClient();
  await ensureBucket(admin);

  const { error } = await admin.storage
    .from(BUCKET)
    .upload(pathFor(user.id), file, { upsert: true, contentType: "application/pdf" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const admin = createAdminClient();
  const { error } = await admin.storage.from(BUCKET).remove([pathFor(user.id)]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
