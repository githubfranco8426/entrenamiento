import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ExerciseForm } from "@/components/exercises/exercise-form";
import { ExerciseMediaDialog } from "@/components/exercises/exercise-media-dialog";
import { ExerciseThumbnail } from "@/components/exercises/exercise-thumbnail";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/ui/delete-button";
import { PlayCircleIcon } from "lucide-react";

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
                  <TableHead></TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Grupo muscular</TableHead>
                  <TableHead>Equipo</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Ejecución</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(exercises ?? []).map((ex) => (
                  <TableRow key={ex.id}>
                    <TableCell>
                      <ExerciseThumbnail src={ex.thumbnail_url} alt={ex.name} />
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/exercises/${ex.id}`} className="hover:text-primary hover:underline">
                        {ex.name}
                      </Link>
                    </TableCell>
                    <TableCell>{ex.muscle_group ?? "—"}</TableCell>
                    <TableCell>{ex.equipment ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={ex.hevy_template_id ? "secondary" : "outline"}>
                        {ex.hevy_template_id ? "Hevy" : "Manual"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {ex.video_url ? (
                        <Button variant="ghost" size="sm" render={<a href={ex.video_url} target="_blank" rel="noreferrer" />}>
                          <PlayCircleIcon /> Ver
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ExerciseMediaDialog
                          exerciseId={ex.id}
                          exerciseName={ex.name}
                          initialThumbnailUrl={ex.thumbnail_url}
                          initialVideoUrl={ex.video_url}
                        />
                        <DeleteButton
                          endpoint={`/api/exercises/${ex.id}`}
                          confirmMessage={`¿Borrar "${ex.name}"? Esta acción no se puede deshacer.`}
                          successMessage="Ejercicio borrado"
                        />
                      </div>
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
