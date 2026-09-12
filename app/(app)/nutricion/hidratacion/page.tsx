import Link from "next/link";
import { ArrowLeftIcon, DropletIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { shiftTypeForDate, SHIFT_TYPE_LABELS } from "@/lib/utils/shift-pattern";
import { HYDRATION_BY_SHIFT } from "@/lib/nutrition/plan";

export default async function HydrationPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("user_settings").select("shift_anchor_date").maybeSingle();

  const shiftType = settings?.shift_anchor_date
    ? shiftTypeForDate(new Date(), new Date(settings.shift_anchor_date))
    : "dia1_diurno";
  const target = HYDRATION_BY_SHIFT[shiftType];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/nutricion" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon className="size-4" /> Nutrición
        </Link>
        <h1 className="mt-2 font-heading text-xl font-bold">Hidratación</h1>
        <p className="text-sm text-muted-foreground">{SHIFT_TYPE_LABELS[shiftType]}</p>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-xl bg-card p-container-padding ring-1 ring-border shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_8px_20px_-8px_rgba(0,0,0,0.6)]">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
          <DropletIcon className="size-6" />
        </div>
        <p className="font-heading text-3xl font-bold">{target.liters}</p>
        <p className="text-center text-sm text-muted-foreground">{target.note}</p>
      </div>
    </div>
  );
}
