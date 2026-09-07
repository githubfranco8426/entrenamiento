---
name: Apex AutoReg Performance
colors:
  surface: '#101417'
  surface-dim: '#101417'
  surface-bright: '#363a3d'
  surface-container-lowest: '#0b0f12'
  surface-container-low: '#181c1f'
  surface-container: '#1c2023'
  surface-container-high: '#262a2e'
  surface-container-highest: '#313539'
  on-surface: '#e0e3e7'
  on-surface-variant: '#c4c9ac'
  inverse-surface: '#e0e3e7'
  inverse-on-surface: '#2d3134'
  outline: '#8e9379'
  outline-variant: '#444933'
  surface-tint: '#abd600'
  primary: '#ffffff'
  on-primary: '#283500'
  primary-container: '#c3f400'
  on-primary-container: '#556d00'
  inverse-primary: '#506600'
  secondary: '#d3fbff'
  on-secondary: '#00363a'
  secondary-container: '#00eefc'
  on-secondary-container: '#00686f'
  tertiary: '#ffffff'
  on-tertiary: '#680018'
  tertiary-container: '#ffdada'
  on-tertiary-container: '#ca0037'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c3f400'
  primary-fixed-dim: '#abd600'
  on-primary-fixed: '#161e00'
  on-primary-fixed-variant: '#3c4d00'
  secondary-fixed: '#7df4ff'
  secondary-fixed-dim: '#00dbe9'
  on-secondary-fixed: '#002022'
  on-secondary-fixed-variant: '#004f54'
  tertiary-fixed: '#ffdada'
  tertiary-fixed-dim: '#ffb3b5'
  on-tertiary-fixed: '#40000b'
  on-tertiary-fixed-variant: '#920025'
  background: '#101417'
  on-background: '#e0e3e7'
  surface-variant: '#313539'
typography:
  display-hero:
    fontFamily: plusJakartaSans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 46px
  display-hero-mobile:
    fontFamily: plusJakartaSans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 38px
  headline-lg:
    fontFamily: plusJakartaSans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
  headline-md:
    fontFamily: plusJakartaSans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 26px
  headline-sm:
    fontFamily: plusJakartaSans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: plusJakartaSans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: plusJakartaSans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: plusJakartaSans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-numeric:
    fontFamily: jetbrainsMono
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
  label-caps:
    fontFamily: plusJakartaSans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter-xs: 0.25rem
  gutter-sm: 0.5rem
  gutter-md: 1rem
  gutter-lg: 1.5rem
  gutter-xl: 2rem
  margin-mobile: 1.25rem
  margin-tablet: 2rem
  container-padding: 1.25rem
  field-height-touch: 3.25rem
---

## Brand & Style
This design system is forged for elite strength athletes, competitive fitness practitioners, and high-performance coaches who rely on real-time biometric periodization and AI autoregulation. The brand evokes relentless discipline, surgical precision, and forward-leaning athletic performance.

The visual style synthesizes **Technical Minimalism** with **Subtle Frosted Glassmorphism** against deep, layered obsidian canvas tones. Instead of decorative clutter, the interface uses high-density functional hierarchy, high-contrast neon volt accents for immediate primary action cues, and kinetic cyan illumination for autoregulatory telemetry and biometric states. Every screen feels engineered, robust, and ergonomically tuned for sweaty thumbs, chalk-dusted screens, and mid-set rapid recognition.

## Colors
The palette operates strictly within a refined high-contrast dark environment designed for OLED screens and extreme power efficiency.

- **Primary (`#CCFF00` - Neon Volt):** Reserved strictly for focal actions, peak readiness status, PR highlights, and critical primary controls. It provides instant cognitive capture without fatigue. Text on primary uses pure black (`#0B0F12`) for AA+ contrast.
- **Secondary (`#00F0FF` - Athletic Cyan):** Applied to autoregulatory telemetry, AI feedback loops, velocity loss gauges, and biometric metrics (HRV, RPE, rest cadence).
- **Tertiary (`#FF3355` - Kinetic Crimson):** Used for maximal exertion warnings, muscular fatigue overload alerts, and destructive confirmations.
- **Canvas & Obsidian Tiers:**
  - Base Canvas: `#0B0F12`
  - Elevated Container / Glass Card: `rgba(19, 25, 31, 0.72)` with border stroke `rgba(255, 255, 255, 0.08)`
  - Surface Muted / Inputs: `rgba(14, 19, 24, 0.90)`
  - Text Primary: `#F4F7F9`
  - Text Secondary / Meta: `#7E8B9B`
  - Ghost Line / Accent Rim: `rgba(204, 255, 0, 0.18)`

## Typography
Plus Jakarta Sans provides high athletic energy, ultra-crisp geometric terminals, and immediate legibility on mobile viewports. JetBrains Mono is paired specifically for data metrics—sets, reps, barbell velocity (m/s), RPE, and countdown timers—ensuring stable visual columns that never shift widths during animated counting.

All metric labels utilize tight tracking and structured capitalization to maintain military-grade precision. Body text keeps generous line height to guarantee effortless scanning between strenuous working sets.

## Layout & Spacing
The layout follows an ergonomic 4-column fluid mobile grid expanding to an 8-column layout on foldables and tablets.

Touch targets must never measure under 48px vertically (`field-height-touch: 3.25rem` / 52px preferred) to support high-intensity workout states. Layout structure prioritizes the "Thumb-Zone": destructive controls and key submit buttons populate the lower third of the screen, while telemetry overviews rest in sticky upper anchors. Horizontal gutters stick to a rhythmic 16px (1rem) spacing cadence, preserving tight cohesion across data cards.

## Elevation & Depth
Depth is created through obsidian luminous layering rather than heavy ambient drop shadows:
- **Base Level (0dp):** Solid obsidian canvas `#0B0F12`.
- **Card Level (1dp):** Translucent composite `rgba(19, 25, 31, 0.72)` with a 1px border stroke of `rgba(255, 255, 255, 0.07)` and a `16px` backdrop filter blur.
- **Active / Focused (2dp):** Card stroke shifts to `rgba(204, 255, 0, 0.4)` accompanied by a subtle 12px outer glow (`box-shadow: 0 0 20px rgba(204, 255, 0, 0.15)`).
- **Overlays & Modals (3dp):** Elevated dark obsidian (`#13191F`) with a 40% alpha dimming scrim over underlying sets.

## Shapes
Roundedness sits at Level 2: balanced, modern, and ergonomic.

Cards and modal containers adopt `rounded-xl` (16px) for an architectural, pocket-fitted profile. Form inputs and segment pills use `rounded-lg` (12px) to match finger pads comfortably. Circular indicators (like heart rate pulses and velocity dials) retain complete `rounded-full` curvature to balance the sharp technical edges of the typography.

## Components

### Buttons & Segment Controls
- **Primary CTA:** Solid Neon Volt (`#CCFF00`) with absolute black text (`#0B0F12`), bold weight, 52px height, `rounded-lg`. Active tap states depress with a scale of `0.98` and a subtle flash of interior brightness.
- **Segmented Switcher (e.g., Iniciar sesión / Crear cuenta):** Encased within a unified dark pill container (`#0E1318`). The active segment assumes an elevated charcoal tone (`#1E262F`) with a fine 1px border and white label; inactive segments render in muted slate (`#7E8B9B`).
- **Ghost / Link Buttons:** Monospaced or bolded text link with zero border, displaying an underline or volt text shift on tap.

### Input Fields
- Dark inset backgrounds (`#0F151B`) with 1px border `rgba(255, 255, 255, 0.08)`.
- 52px minimum height with generous padding (16px horizontal).
- Floating or top-pinned metadata labels in athletic uppercase (`label-caps`).
- Focused states ignite a 1px Volt border (`#CCFF00`) with zero inner layout jitter.

### Performance Cards & Telemetry
- Structured cards with glassmorphism surface (`rgba(19, 25, 31, 0.72)`), providing clear grouping for exercise sets, reps, and RPE sliders.
- Metrics display using JetBrains Mono with secondary cyan labels to denote AI auto-adjustments (e.g., `+2.5 kg [AI LOAD]`).

### Autoregulation Sliders & Toggles
- Custom slider tracks featuring dual-tone gradients transitioning from athletic cyan to volt neón, offering tactile haptic feedback at each discrete RPE interval (RPE 7.0 -> 10.0).
- Checkboxes and radio targets provide oversized 24x24px targets with a high-contrast volt fill upon check verification.
