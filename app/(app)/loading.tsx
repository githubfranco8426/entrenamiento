export default function LoadingSection() {
  return (
    <div role="status" aria-live="polite" className="space-y-5">
      <p className="text-sm text-muted-foreground">Cargando sección…</p>
      <div aria-hidden="true" className="space-y-5 motion-safe:animate-pulse">
        <div className="h-8 w-52 rounded-md bg-muted" />
        <div className="h-40 rounded-lg border border-border bg-card" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-md bg-muted" />)}
        </div>
        <div className="h-48 rounded-lg border border-border bg-card" />
      </div>
    </div>
  );
}
