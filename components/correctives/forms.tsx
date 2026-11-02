"use client";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  library,
  patterns,
  planSchema,
  type Prescription,
} from "@/lib/correctives/model";
import { lumbarRoutine, lumbarGuides } from "@/lib/correctives/routine";
export type Save = (body: unknown) => Promise<boolean>;
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="correctives-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function PlanEditor({
  value,
  save,
  busy,
}: {
  value: Prescription[];
  save: Save;
  busy: boolean;
}) {
  const [draft, setDraft] = useState(value);
  const [place, setPlace] = useState("Todos");
  const [pattern, setPattern] = useState("Todos");
  const [error, setError] = useState("");
  function update(index: number, key: string, value: string | number) {
    setDraft((d) =>
      d.map((p, i) => (i === index ? { ...p, [key]: value } : p)),
    );
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    const p = planSchema.safeParse(draft);
    if (!p.success) {
      setError(p.error.issues[0].message);
      return;
    }
    setError("");
    await save({ op: "plan", data: p.data });
  }
  return (
    <div className="correctives-stack">
      <section className="correctives-panel">
        <p className="eyebrow">BIBLIOTECA DE VECTORES</p>
        <h2>Elige el patrón, define la dosis.</h2>
        <p>
          Biblioteca inicial de variantes. Los valores iniciales son campos de
          edición, pendientes de tu revisión.
        </p>
        <div className="correctives-grid">
          <Field label="Lugar">
            <select value={place} onChange={(e) => setPlace(e.target.value)}>
              {["Todos", "Gimnasio", "Casa"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="Patrón">
            <select
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
            >
              {["Todos", ...patterns].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="correctives-library">
          {library
            .filter(
              (e) =>
                (place === "Todos" || e.place === place) &&
                (pattern === "Todos" || e.pattern === pattern),
            )
            .map((e) => (
              <article key={e.id}>
                <span className="eyebrow">
                  {e.place} / {e.pattern}
                </span>
                <h3>{e.name}</h3>
                {lumbarGuides[e.id] && <p>{lumbarGuides[e.id].cue}</p>}
                <Button
                  variant="outline"
                  disabled={busy || draft.some((p) => p.exercise === e.id)}
                  onClick={() =>
                    setDraft((d) => [
                      ...d,
                      {
                        exercise: e.id,
                        sets: 1,
                        repsMin: 8,
                        repsMax: 12,
                        rir: 3,
                        rest: 90,
                        tempo: "3-0-1-0",
                      },
                    ])
                  }
                >
                  {draft.some((p) => p.exercise === e.id)
                    ? "Añadido"
                    : "Añadir al plan"}
                </Button>
              </article>
            ))}
        </div>
      </section>
      <form onSubmit={submit} className="correctives-panel correctives-stack">
        <p className="eyebrow">02 / PRESCRIPCIÓN PERSONAL</p>
        <h2>Tu dosis, bajo tu control.</h2>
        <p>
          Guarda tus ajustes para conservarlos. La rutina inicial es una
          propuesta editable de control lumbopélvico.
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => setDraft(lumbarRoutine.map((p) => ({ ...p })))}
        >
          Usar propuesta para hiperlordosis
        </Button>
        {draft.length === 0 && (
          <p>Añade un ejercicio desde la biblioteca para comenzar.</p>
        )}
        <fieldset disabled={busy} className="correctives-stack">
          {draft.map((p, i) => (
            <section className="correctives-exercise" key={p.exercise}>
              <div className="correctives-row">
                <h3>{library.find((e) => e.id === p.exercise)?.name}</h3>
                <Button
                  variant="ghost"
                  type="button"
                  aria-label={`Quitar ${library.find((e) => e.id === p.exercise)?.name}`}
                  onClick={() => setDraft((d) => d.filter((_, j) => i !== j))}
                >
                  Quitar
                </Button>
              </div>
              <div className="correctives-grid compact">
                {(
                  [
                    ["sets", "Series", 1, 10],
                    ["repsMin", "Reps mín.", 1, 100],
                    ["repsMax", "Reps máx.", 1, 100],
                    ["rir", "RIR objetivo", 0, 10],
                    ["rest", "Descanso · s", 0, 1800],
                  ] as const
                ).map(([key, label, min, max]) => (
                  <Field key={key} label={label}>
                    <Input
                      required
                      type="number"
                      min={min}
                      max={max}
                      step={1}
                      value={Number.isNaN(p[key]) ? "" : p[key]}
                      onChange={(e) =>
                        update(
                          i,
                          key,
                          e.target.value === "" ? NaN : Number(e.target.value),
                        )
                      }
                    />
                  </Field>
                ))}
                <Field label="Tempo · exc-pausa-conc-pausa">
                  <Input
                    required
                    pattern="[0-9]{1,2}-[0-9]{1,2}-[0-9]{1,2}-[0-9]{1,2}"
                    value={p.tempo}
                    onChange={(e) => update(i, "tempo", e.target.value)}
                  />
                </Field>
              </div>
            </section>
          ))}
        </fieldset>
        {error && <p role="alert">{error}</p>}
        <Button type="submit" disabled={busy || draft.length === 0}>
          Guardar prescripción
        </Button>
      </form>
    </div>
  );
}
