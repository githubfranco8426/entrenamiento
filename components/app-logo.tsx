/** Marca monocromática basada en la referencia de Stitch. */
export function AppLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} role="img" aria-label="Entrenamiento">
      <rect x="1" y="1" width="62" height="62" rx="14" fill="var(--card)" stroke="var(--border)" strokeWidth="2" />
      <g stroke="var(--primary)" strokeLinecap="round" strokeWidth="4">
        <path d="M21 43 43 21M17 33l14 14M33 17l14 14M13 37l14 14M37 13l14 14" />
      </g>
    </svg>
  );
}
