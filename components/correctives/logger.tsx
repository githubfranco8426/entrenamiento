"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  library,
  remainingSeconds,
  setSchema,
  type LoggedSet,
  type Prescription,
  type Session,
} from "@/lib/correctives/model";
import { Field, type Save } from "./forms";

function RestTimer({ until }: { until: string }) {
  const [left, setLeft] = useState(() => remainingSeconds(until));
  useEffect(() => {
    const update = () => setLeft(remainingSeconds(until));
    const timer = window.setInterval(update, 500);
    document.addEventListener("visibilitychange", update);
    window.addEventListener("focus", update);
    update();
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("focus", update);
    };
  }, [until]);
  return (
    <div className="correctives-timer">
      <span>Descanso</span>
      <strong role="timer" aria-label={`${left} segundos restantes`}>
        {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
      </strong>
      <span aria-live="polite">
        {left === 0
          ? "Descanso finalizado"
          : "Continúa aunque cambies de pestaña"}
      </span>
    </div>
  );
}
function SetForm({
  session,
  prescription,
  sets,
  save,
  busy,
}: {
  session: Session;
  prescription: Prescription;
  sets: LoggedSet[];
  save: Save;
  busy: boolean;
}) {
  const [kind, setKind] = useState("kg");
  const [error, setError] = useState("");
  const pending = useRef<ReturnType<typeof setSchema.parse> | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const ordinal = Array.from(
    { length: prescription.sets },
    (_, i) => i + 1,
  ).find((n) => !sets.some((s) => s.ordinal === n));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pending.current) {
      const f = new FormData(event.currentTarget);
      const parsed = setSchema.safeParse({
        id: crypto.randomUUID(),
        session_id: session.id,
        exercise: prescription.exercise,
        ordinal,
        load_type: kind,
        load: kind === "kg" ? Number(f.get("load")) : null,
        equipment: f.get("equipment"),
        reps: Number(f.get("reps")),
        rir: Number(f.get("rir")),
        quality: f.get("quality") || null,
      });
      if (!parsed.success) {
        setError(parsed.error.issues[0].message);
        return;
      }
      pending.current = parsed.data;
    }
    setError("");
    if (await save({ op: "set", data: pending.current })) {
      pending.current = null;
      setUncertain(false);
    } else setUncertain(true);
  }
  return (
    <section className="correctives-panel correctives-stack">
      <div>
        <p className="eyebrow">
          {sets.length} / {prescription.sets} SERIES CONFIRMADAS
        </p>
        <h3>{library.find((e) => e.id === prescription.exercise)?.name}</h3>
        <p>
          {prescription.repsMin}–{prescription.repsMax} repeticiones · RIR{" "}
          {prescription.rir} · {prescription.rest} s · tempo{" "}
          {prescription.tempo}
        </p>
      </div>
      <ul className="correctives-set-list">
        {sets
          .sort((a, b) => a.ordinal - b.ordinal)
          .map((s) => (
            <li key={s.id}>
              <span>✓ Serie {s.ordinal}</span>
              <span>
                {s.load_type === "kg" ? `${s.load} kg` : s.load_type} ·{" "}
                {s.equipment} · {s.reps} reps · RIR {s.rir}
                {s.quality ? ` · ${s.quality}` : ""}
              </span>
            </li>
          ))}
      </ul>
      {ordinal ? (
        <form onSubmit={submit} className="correctives-stack">
          <fieldset
            disabled={busy || uncertain}
            className="correctives-grid compact"
          >
            <Field label="Resistencia">
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="kg">Carga externa · kg totales</option>
                <option value="banda">Banda</option>
                <option value="corporal">Peso corporal</option>
              </select>
            </Field>
            {kind === "kg" && (
              <Field label="Carga externa total · kg">
                <Input
                  name="load"
                  required
                  type="number"
                  min={0}
                  max={1000}
                  step={0.1}
                />
              </Field>
            )}
            <Field
              label={
                kind === "banda"
                  ? "Marca, banda y montaje"
                  : "Equipo / variante comparable"
              }
            >
              <Input
                name="equipment"
                required
                maxLength={100}
                placeholder={
                  kind === "banda"
                    ? "Marca, color, anclaje"
                    : "Ej.: 2 mancuernas, banco 30°"
                }
              />
            </Field>
            <Field label="Repeticiones realizadas">
              <Input
                name="reps"
                required
                type="number"
                min={1}
                max={100}
                step={1}
              />
            </Field>
            <Field label="RIR real">
              <Input
                name="rir"
                required
                type="number"
                min={0}
                max={10}
                step={1}
              />
            </Field>
            <Field label="Calidad motora (opcional)">
              <select name="quality">
                <option value="">Sin registrar</option>
                {["Fluida", "Compensación", "Interrumpida"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </Field>
          </fieldset>
          {uncertain && (
            <p role="alert">
              Guardado sin confirmar. Reintentar envía exactamente la misma
              serie. También puedes actualizar los registros para comprobarla.
            </p>
          )}
          {error && <p role="alert">{error}</p>}
          <Button type="submit" disabled={busy}>
            {busy
              ? "Confirmando…"
              : uncertain
                ? "Reintentar la misma serie"
                : `Completar serie ${ordinal}`}
          </Button>
        </form>
      ) : (
        <p className="correctives-success">
          Ejercicio registrado por completo.
        </p>
      )}
    </section>
  );
}
export function SessionLogger({
  session,
  sets,
  save,
  busy,
}: {
  session: Session;
  sets: LoggedSet[];
  save: Save;
  busy: boolean;
}) {
  const own = sets.filter((s) => s.session_id === session.id);
  const latest = [...own].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  )[0];
  return (
    <div className="correctives-stack">
      <section className="correctives-panel">
        <p className="eyebrow">03 / SESIÓN ACTIVA</p>
        <h2>Una serie a la vez.</h2>
        <p>
          Se recuperaron {own.length} series del servidor. La sesión sigue
          abierta hasta que la finalices.
        </p>
        {latest && (
          <RestTimer key={latest.rest_until} until={latest.rest_until} />
        )}
      </section>
      {session.plan.map((p) => (
        <SetForm
          key={`${p.exercise}:${own.filter((s) => s.exercise === p.exercise).length}`}
          session={session}
          prescription={p}
          sets={own.filter((s) => s.exercise === p.exercise)}
          save={save}
          busy={busy}
        />
      ))}
      <div className="correctives-panel correctives-stack">
        <p>
          Puedes terminar con series pendientes. Solo se analizarán las
          registradas.
        </p>
        <Button
          disabled={busy}
          onClick={() => save({ op: "finish", id: session.id })}
        >
          Finalizar y guardar sesión
        </Button>
      </div>
    </div>
  );
}
