export default function OpenGymPage() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-heading text-xl font-bold">OpenGym</h1>
      <p className="text-sm text-muted-foreground">Rutinas, progresión, estadísticas y entrenador IA. Usa los controles superiores para intercambiar datos con Entrenamiento.</p>
      <a className="text-sm text-primary underline" href="/opengym-app/index.html">Abrir OpenGym en pantalla completa</a>
      <iframe title="OpenGym" src="/opengym-app/index.html" className="h-[80dvh] min-h-[600px] w-full rounded-xl border border-border" allow="screen-wake-lock" />
    </div>
  );
}
