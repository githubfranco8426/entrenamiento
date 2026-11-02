"use client";
import { Button } from "@/components/ui/button";
export default function ErrorView({ reset }: { reset: () => void }) {
  return <div className="flex flex-col gap-4 rounded-2xl border p-6"><h1 className="text-xl font-semibold">No se pudo abrir Correctivos</h1><p role="alert">Tus registros confirmados permanecen guardados. Comprueba la conexión y vuelve a intentar.</p><Button onClick={reset}>Reintentar</Button></div>;
}
