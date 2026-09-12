import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { shiftTypeForDate, SHIFT_TYPE_LABELS } from "@/lib/utils/shift-pattern";
import { MEAL_PLAN_BY_SHIFT } from "@/lib/nutrition/plan";
import { Card, CardContent } from "@/components/ui/card";

export default async function NutritionMenuPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("user_settings").select("shift_anchor_date").maybeSingle();

  const shiftType = settings?.shift_anchor_date
    ? shiftTypeForDate(new Date(), new Date(settings.shift_anchor_date))
    : "dia1_diurno";
  const plan = MEAL_PLAN_BY_SHIFT[shiftType];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/nutricion" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon className="size-4" /> Nutrición
        </Link>
        <h1 className="mt-2 font-heading text-xl font-bold">Menú de hoy</h1>
        <p className="text-sm text-muted-foreground">{SHIFT_TYPE_LABELS[shiftType]}</p>
      </div>

      <div className="flex flex-col gap-2">
        {plan.meals.map((meal) => (
          <Card key={`${meal.time}-${meal.name}`}>
            <CardContent className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-widest text-primary">{meal.time}</span>
                <span className="text-sm font-semibold">{meal.name}</span>
              </div>
              <p className="text-sm text-muted-foreground">{meal.foods}</p>
              {meal.kcal > 0 && (
                <p className="font-mono text-[11px] text-muted-foreground">
                  {meal.kcal} kcal · {meal.proteinG}g prote · {meal.carbsG}g carbos · {meal.fatG}g grasas
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
