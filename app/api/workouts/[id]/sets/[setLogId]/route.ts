import { NextResponse } from "next/server";
export async function PATCH() { return NextResponse.json({ error: "Actualizá la app para editar con guardado seguro." }, { status: 409 }); }
export const DELETE = PATCH;
