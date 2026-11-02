"use client";
import { Button } from "@/components/ui/button";
import { library, type Prescription } from "@/lib/correctives/model";
import { lumbarRoutine, lumbarGuides } from "@/lib/correctives/routine";

export function CorrectiveRoutine({
  plan,
  edit,
}: {
  plan: Prescription[];
  edit: () => void;
}) {
  const saved = plan.length > 0;
  const current = saved ? plan : lumbarRoutine;
  return (
    <div className="correctives-stack">
      <section className="correctives-panel correctives-stack">
        <div>
          <p className="eyebrow">HIPERLORDOSIS / CONTROL LUMBOPÉLVICO</p>
          <h2>
            {saved ? "Tu rutina de correctivos" : "Rutina inicial lumbopélvica"}
          </h2>
          <p>
            Propuesta de baja carga para practicar control y tolerancia al
            movimiento. No busca eliminar la curva lumbar ni mantener la espalda
            plana todo el día.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <span>Casa · colchoneta</span>
          <span>8–12 minutos orientativos</span>
          <span>Inicio: 3 días por semana</span>
        </div>
        <p>
          Empieza con una serie por ejercicio y un esfuerzo cómodo, lejos del
          fallo. El RIR es orientativo: prioriza respirar y controlar el
          movimiento. Revisa la respuesta ese día y a la mañana siguiente antes
          de añadir una segunda serie.
        </p>
        <Button onClick={edit}>
          {saved ? "Editar mi rutina" : "Ajustar y guardar esta rutina"}
        </Button>
        {!saved && (
          <small>
            Propuesta disponible para revisar; todavía no guardada como tu plan
            personal.
          </small>
        )}
      </section>
      {current.map((p, i) => {
        const guide = lumbarGuides[p.exercise];
        return (
          <article
            key={p.exercise}
            className="correctives-panel correctives-stack"
          >
            <div>
              <p className="eyebrow">
                {String(i + 1).padStart(2, "0")} /{" "}
                {library.find((e) => e.id === p.exercise)?.pattern}
              </p>
              <h3>{library.find((e) => e.id === p.exercise)?.name}</h3>
              <p>
                <strong>
                  {p.sets} {p.sets === 1 ? "serie" : "series"} · {p.repsMin}–
                  {p.repsMax} repeticiones{guide?.perSide ? " por lado" : ""}
                </strong>{" "}
                · descanso {p.rest} s · tempo {p.tempo}
              </p>
            </div>
            {guide && (
              <>
                <p>{guide.cue}</p>
                <p>
                  <strong>Si cuesta:</strong> {guide.easier}
                </p>
              </>
            )}
          </article>
        );
      })}
      <section className="correctives-panel correctives-stack">
        <p>
          Usa un rango cómodo. Detén el ejercicio si aparece dolor irradiado,
          hormigueo o un aumento claro del dolor; revisa la pauta antes de
          continuar.
        </p>
        <details>
          <summary>Criterio y referencias</summary>
          <p>
            La selección y dosis son una propuesta inicial editable; no una
            pauta probada para modificar tu ángulo lumbar. La evidencia sobre
            cambios de lordosis con ejercicio es limitada.
          </p>
          <p>
            <a
              href="https://pubmed.ncbi.nlm.nih.gov/31034509/"
              target="_blank"
              rel="noreferrer"
            >
              Revisión de ejercicio y curvaturas vertebrales
            </a>{" "}
            ·{" "}
            <a
              href="https://www.cuh.nhs.uk/patient-information/back-mobility-exercises/"
              target="_blank"
              rel="noreferrer"
            >
              Ejercicios de movilidad lumbar · Cambridge University Hospitals
            </a>{" "}
            ·{" "}
            <a
              href="https://www.nhsfife.org/services/all-services/patient-advice/stage-two-exercises-for-your-tummy-muscles/"
              target="_blank"
              rel="noreferrer"
            >
              Control abdominal · NHS Fife
            </a>
          </p>
        </details>
      </section>
    </div>
  );
}
