import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ExerciseForm } from "@/components/exercises/exercise-form";

export default async function ExercisesPage() {
  const supabase = await createClient();
  const { data: exercises } = await supabase.from("exercises").select("*").order("name");

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo ejercicio</CardTitle>
        </CardHeader>
        <CardContent>
          <ExerciseForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catálogo</CardTitle>
        </CardHeader>
        <CardContent>
          {(exercises ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no agregaste ningún ejercicio.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Grupo muscular</TableHead>
                  <TableHead>Equipo</TableHead>
                  <TableHead>Origen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(exercises ?? []).map((ex) => (
                  <TableRow key={ex.id}>
                    <TableCell className="font-medium">{ex.name}</TableCell>
                    <TableCell>{ex.muscle_group ?? "—"}</TableCell>
                    <TableCell>{ex.equipment ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={ex.hevy_template_id ? "secondary" : "outline"}>
                        {ex.hevy_template_id ? "Hevy" : "Manual"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
