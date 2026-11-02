import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { correctiveAccess } from "@/lib/correctives/server";
import { CorrectiveWorkspace } from "@/components/correctives/workspace";
import "./correctives.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Ejercicios correctivos | Entrenamiento",
  description: "Evaluación personal, dosificación y registro de ejercicios correctivos.",
  robots: { index: false, follow: false },
};
export default async function CorrectivesPage() {
  const { user } = await correctiveAccess();
  if (!user) redirect("/login");
  return <CorrectiveWorkspace />;
}
