/** Marca "Entrenamiento IA" — design/stitch-ui-visual-redesign/01-logo-entrenamiento-ia. */
export function AppLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} role="img" aria-label="Entrenamiento IA">
      <defs>
        <linearGradient id="app-logo-bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#182334" />
          <stop offset="100%" stopColor="#0B0F19" />
        </linearGradient>
        <linearGradient id="app-logo-glow" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D4FF28" />
          <stop offset="100%" stopColor="#00F0FF" />
        </linearGradient>
        <filter id="app-logo-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <rect width="100" height="100" rx="28" fill="url(#app-logo-bg)" stroke="rgba(212, 255, 40, 0.25)" strokeWidth="2" />
      <g transform="translate(50, 50) rotate(-45) translate(-50, -50)">
        <rect x="36" y="46" width="28" height="8" rx="4" fill="#FFFFFF" />
        <rect x="46" y="44" width="8" height="12" rx="3" fill="#D4FF28" filter="url(#app-logo-blur)" />
        <rect x="26" y="32" width="10" height="36" rx="5" fill="url(#app-logo-glow)" />
        <rect x="18" y="38" width="8" height="24" rx="4" fill="#00F0FF" opacity="0.8" />
        <rect x="64" y="32" width="10" height="36" rx="5" fill="url(#app-logo-glow)" />
        <rect x="74" y="38" width="8" height="24" rx="4" fill="#00F0FF" opacity="0.8" />
      </g>
      <circle cx="78" cy="78" r="6" fill="#00F0FF" filter="url(#app-logo-blur)" />
      <circle cx="78" cy="78" r="3" fill="#FFFFFF" />
    </svg>
  );
}
