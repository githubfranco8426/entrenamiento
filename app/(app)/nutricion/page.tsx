import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ClipboardListIcon, PillIcon, DropletIcon, ArrowLeftRightIcon, type LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { shiftTypeForDate } from "@/lib/utils/shift-pattern";
import { MEAL_PLAN_BY_SHIFT } from "@/lib/nutrition/plan";
import { StatRing } from "@/components/dashboard/stat-ring";

const LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/nutricion/menu", label: "Menú de hoy", icon: ClipboardListIcon },
  { href: "/nutricion/suplementos", label: "Suplementos", icon: PillIcon },
  { href: "/nutricion/hidratacion", label: "Hidratación", icon: DropletIcon },
  { href: "/nutricion/reemplazos", label: "Reemplazos", icon: ArrowLeftRightIcon },
];

export default async function NutritionPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("user_settings").select("shift_anchor_date").maybeSingle();

  const today = new Date();
  const shiftType = settings?.shift_anchor_date
    ? shiftTypeForDate(today, new Date(settings.shift_anchor_date))
    : "dia1_diurno";
  const plan = MEAL_PLAN_BY_SHIFT[shiftType];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">Nutrición</p>
        <h1 className="font-heading text-xl font-bold">{format(today, "EEEE d 'de' MMMM", { locale: es })}</h1>
        <p className="text-sm text-muted-foreground">{plan.label}</p>
      </div>

      <div className="flex items-center justify-around rounded-xl bg-card px-gutter-md py-gutter-lg ring-1 ring-border shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_8px_20px_-8px_rgba(0,0,0,0.6)]">
        <StatRing pct={100} value={`${plan.totalKcal}`} label="Kcal" color="var(--primary)" />
        <StatRing pct={100} value={`${plan.totalProteinG}g`} label="Proteína" color="var(--secondary)" />
        <StatRing pct={100} value={`${plan.totalCarbsG}g`} label="Carbos" color="var(--tertiary)" />
        <StatRing pct={100} value={`${plan.totalFatG}g`} label="Grasas" color="var(--chart-4)" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2.5 rounded-xl bg-card p-container-padding ring-1 ring-border shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_8px_20px_-8px_rgba(0,0,0,0.6)] transition-colors hover:bg-accent"
          >
            <Icon className="size-5 shrink-0 text-primary" />
            <span className="text-sm font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
