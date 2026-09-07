---
name: Kinetic AI Conditioning
colors:
  surface: '#0f131b'
  surface-dim: '#0f131b'
  surface-bright: '#353941'
  surface-container-lowest: '#0a0e15'
  surface-container-low: '#181c23'
  surface-container: '#1c2027'
  surface-container-high: '#262a32'
  surface-container-highest: '#31353d'
  on-surface: '#dfe2ed'
  on-surface-variant: '#c5c9ad'
  inverse-surface: '#dfe2ed'
  inverse-on-surface: '#2d3038'
  outline: '#8f9379'
  outline-variant: '#444933'
  surface-tint: '#afd500'
  primary: '#ffffff'
  on-primary: '#2a3500'
  primary-container: '#c8f313'
  on-primary-container: '#586c00'
  inverse-primary: '#526600'
  secondary: '#d3fbff'
  on-secondary: '#00363a'
  secondary-container: '#00eefc'
  on-secondary-container: '#00686f'
  tertiary: '#ffffff'
  on-tertiary: '#3c0090'
  tertiary-container: '#e9ddff'
  on-tertiary-container: '#7829ff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c8f313'
  primary-fixed-dim: '#afd500'
  on-primary-fixed: '#171e00'
  on-primary-fixed-variant: '#3d4c00'
  secondary-fixed: '#7df4ff'
  secondary-fixed-dim: '#00dbe9'
  on-secondary-fixed: '#002022'
  on-secondary-fixed-variant: '#004f54'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#d1bcff'
  on-tertiary-fixed: '#23005b'
  on-tertiary-fixed-variant: '#5700c9'
  background: '#0f131b'
  on-background: '#dfe2ed'
  surface-variant: '#31353d'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: 0em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 19px
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  tech-pill:
    fontFamily: Space Grotesk
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.12em
  label-numeric:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.04em
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-3xs: 0.125rem
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.25rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 2.5rem
  screen-margin: 1.25rem
  card-padding: 1.125rem
  compact-padding: 0.75rem
---

## Brand & Style

This design system establishes a high-performance, athletic intelligence interface designed for elite conditioning, autoregulation, and adaptive periodization. Merging the technical precision of biomedical telemetry (Whoop, Oura) with the visual energy and confidence of contemporary performance sports (Nike Training Club, Apple Fitness+), the aesthetic blends technical dark mode minimalism with refined glassmorphism and luminescent neon energy accents.

The emotional core is **empowered mastery and technical precision**. The interface rejects clumsy, flat containers and muddy silhouettes in favor of lightweight translucent surfaces, fine gradient rim-lighting, calibrated depth hierarchies, and razor-sharp typographic tracking. Every interaction signals algorithmic fluidity and zero-latency biological feedback.

## Colors

The palette operates in high-contrast optical tiers designed specifically for deep OLED mobile screens:

- **Base Void (`#090D14`) & Surface Deep (`#0D131F`)**: True obsidian bases with an ultra-subtle blue-slate undertone to eliminate LCD murkiness and provide infinite contrast.
- **Glass Card Surfaces (`rgba(17, 25, 40, 0.72)`)**: Semi-translucent panels paired with hairline rim strokes (`rgba(255, 255, 255, 0.08)`) that refract background ambiance without adding cognitive heaviness.
- **Primary Kinetic Lime (`#D4FF28`)**: An ultra-energized, luminescent accent dedicated to primary calls to action, active states, and maximum-focus metric spikes (e.g., peak strain, primary workout triggers).
- **Secondary Cyber Cyan (`#00F0FF`)**: A crisp, technological neon reserved for algorithmic statuses, telemetry pulses, biometric indicators, and real-time adaptive feedback.
- **Tertiary Deep Plasma (`#7000FF`)**: Used sparingly for deep ambient radial glows, underlying dark gradients, and secondary AI state transitions.
- **Neutral Hierarchy**: Content is articulated using crisp cool whites (`#F5F8FC`) for primary headers, soft silver slate (`#94A3B8`) for body metadata and labels, and deep structural boundary borders (`rgba(148, 163, 184, 0.12)`).

## Typography

Typography fuses dynamic athletic legibility with scientific, monospaced rhythm.

- **Primary Typeface (Plus Jakarta Sans)**: Governs major headings, narrative copy, labels, and modal triggers. Its geometric yet slightly rounded curves balance sharp high-tech coldness with biomechanical ergonomics.
- **Telemetry & Technical Font (Space Grotesk)**: Powers data values, AI engine status pills, RPE / RIR offsets, and numerical badges. The monospaced cadence provides immediate cognitive parsing for athletes reviewing strain under physical fatigue.
- **Hierarchical Rhythm**:
  - Headings feature compact, negative tracking (`-0.02em` to `-0.03em`) to anchor layouts with commanding presence.
  - Micro-labels, neural telemetry, and sub-headers are uppercase with deliberate letter-spacing (`0.08em` to `0.14em`) to establish crisp technical authority.

## Layout & Spacing

The layout embraces mobile-first ergonomics built on a strict 4px/8px modular baseline with fluid vertical breathing space:

- **Edge Margins**: Standardized at `1.25rem` (20px) on mobile views, ensuring interactive elements remain safely inside modern phone touch envelopes while maximizing the usable canvas for cards and data visualizations.
- **Vertical Stack Density**: Section boundaries utilize `1.5rem` to `2rem` spacing. Elements within a single biometric card are grouped densely (`0.375rem` to `0.75rem`) to ensure clear visual chunking without dead space.
- **Touch Targets**: All interactive triggers, input heights, and segmented control chips adhere to a minimum physical touch footprint of 48px height.
- **Card Interior Padding**: Primary telemetry and form cards use `1.125rem` (18px) to frame content comfortably without crowding micro-charts or status tags.

## Elevation & Depth

Visual hierarchy abandons heavy, opaque black drop shadows in favor of luminous multi-layered optical glass and internal refraction:

- **Level 0 (App Canvas)**: Deep void `#090D14` paired with subtle, localized ambient radial gradients (`radial-gradient(circle at top right, rgba(0, 240, 255, 0.08), transparent 45%)`) that generate soft organic dimensionality.
- **Level 1 (Structural Cards & Inputs)**: Surface `rgba(13, 19, 31, 0.65)` with `backdrop-filter: blur(16px)`, bound by a delicate 1px gradient stroke (`linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.02) 100%)`).
- **Level 2 (Interactive Floating Elements & Focus States)**: Activated cards and floating sheets elevate via dual-layer illumination: a 1px border highlighted with `rgba(212, 255, 40, 0.35)` and an ambient exterior glow: `0 8px 32px -4px rgba(0, 0, 0, 0.6), 0 0 24px 0 rgba(212, 255, 40, 0.12)`.
- **Level 3 (Neon Primary Triggers)**: High-impact primary buttons feature an internal top-down rim highlight (`inset 0 1px 1px rgba(255, 255, 255, 0.6)`) and an external kinetic bloom (`box-shadow: 0 0 24px -2px rgba(212, 255, 40, 0.45)`), lifting them instantly off the canvas.

## Shapes

The shape system employs an ergonomic curve scale that feels futuristic yet organic to human touch:

- **Cards & Primary Modules**: Standardized to `1.25rem` (20px) border-radius, creating smooth containment that softens technical telemetry.
- **Buttons & Segmented Toggles**: Styled with continuous pill radius (`62.5rem` / 9999px) or refined athletic corners (`0.875rem` / 14px) depending on contextual hierarchy.
- **Inputs & Field Enclosures**: Built with `0.875rem` (14px) curves to pair harmoniously with inner icon circles and card corners.
- **Status Pills & Micro Badges**: Full capsule / pill radii (`9999px`) to maintain distinctive visual separation from angular chart geometry.

## Components

### 1. Kinetic Neon Buttons
- **Primary CTA**: Styled in high-potency Kinetic Lime (`#D4FF28`) with an ultra-subtle vertical microgradient shifting into `#BBF213`. Text is deep obsidian (`#090D14`, 700 weight). The surface features an internal optical highlight (`inset 0 1px 0 rgba(255, 255, 255, 0.5)`) and an active neon diffuse drop-shadow (`0 10px 25px -5px rgba(212, 255, 40, 0.38)`). Touch feedback yields a slight scale compression (`0.98`) with intensified glow.
- **Secondary Ghost / Outline**: Frosted glass surface (`rgba(255, 255, 255, 0.04)`) with a translucent hairline rim (`rgba(255, 255, 255, 0.12)`). On tap or focus, the border seamlessly transitions into Cyber Cyan (`#00F0FF`).

### 2. Segmented Pill Controls
- Replaces rigid, flat tabs with an integrated floating capsule.
- Enclosed in a recessed frosted channel (`rgba(255, 255, 255, 0.03)` with a `1px` inner shadow).
- The active tab glides as an illuminated glass segment (`rgba(255, 255, 255, 0.1)`) backed by a crisp 1px highlight border (`rgba(255, 255, 255, 0.2)`), creating smooth tactile depth without jarring contrast.

### 3. Glassmorphic Data Cards
- Applied to performance features such as *RPE & RIR Adaptativo*, *Periodización Ondulante IA*, and *Readiness*.
- Built using `backdrop-filter: blur(20px)` over `rgba(13, 19, 31, 0.7)`.
- **Accent Indicator**: A vertical neon micro-pipette or glowing vector badge sits on the left perimeter.
- **Metrics & Badges**: Accompanied by monospaced status indicators (`+0.25 RIR`, `DUP/AUTO`) styled in semi-translucent neon capsule chips (`rgba(0, 240, 255, 0.1)` text `#00F0FF` with a hairline cyan border).

### 4. Precision Input Fields
- Dark floating glass inputs (`rgba(17, 25, 40, 0.6)`) with high-legibility cool white type.
- Integrated dual-tone micro-icons (e.g., biometric fingerprint, padlock, user vector) tinted in muted cyan-slate (`#64748B`).
- Active focus smoothly morphs the border into a vivid Cyber Cyan gradient stroke with a low-spread outer ambient aura (`0 0 16px rgba(0, 240, 255, 0.2)`).

### 5. Telemetry Badges & Engine Indicators
- Status pills (e.g., `MOTOR NEURONAL V2.4 • LISTO`) are rendered in dark capsules with a pulsating neon dot.
- Text rendered in `Space Grotesk` uppercase (`10px`, tracking `0.12em`), delivering immediate algorithmic state clarity.
