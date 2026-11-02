"use client";
import { useState } from "react";
import { library, progression, type Workspace } from "@/lib/correctives/model";
import { Field } from "./forms";
export function Progress({ data }: { data: Workspace }) {
  const groups = progression(data.sessions, data.sets);
  const choices = [
    ...new Set(groups.map((g) => JSON.stringify([g.exercise, g.equipment]))),
  ];
  const [selection, setSelection] = useState("");
  const selected = selection || choices[0];
  const comparable = groups.filter(
    (g) => JSON.stringify([g.exercise, g.equipment]) === selected,
  );
  const max = Math.max(1, ...comparable.map((g) => g.volume));
  return (
    <div className="correctives-stack">
      <section className="correctives-panel correctives-stack">
        <p className="eyebrow">04 / EVOLUCIÓN</p>
        <h2>Progreso con contexto.</h2>
        <p>
          Volumen externo = kg totales × repeticiones. Se compara el mismo
          ejercicio y equipo descrito exactamente igual. Bandas y peso corporal
          se conservan en el historial, sin convertirlos a kg.
        </p>
        {choices.length ? (
          <>
            <Field label="Ejercicio y equipo comparables">
              <select
                value={selected}
                onChange={(e) => setSelection(e.target.value)}
              >
                {choices.map((c) => {
                  const [exercise, equipment] = JSON.parse(c);
                  return (
                    <option key={c} value={c}>
                      {library.find((e) => e.id === exercise)?.name} ·{" "}
                      {equipment}
                    </option>
                  );
                })}
              </select>
            </Field>
            <div
              className="correctives-chart"
              role="img"
              aria-label="Volumen externo de sesiones terminadas. Valores detallados en la tabla siguiente."
            >
              {comparable.map((g) => (
                <div key={g.session.id} className="correctives-bar-row">
                  <span>
                    {new Date(g.session.started_at).toLocaleDateString(
                      "es-CL",
                      { timeZone: "America/Santiago" },
                    )}
                  </span>
                  <div>
                    <i style={{ width: `${(g.volume / max) * 100}%` }} />
                  </div>
                  <strong>{g.volume.toFixed(1)}</strong>
                </div>
              ))}
            </div>
            <div className="correctives-table-scroll">
              <table>
                <caption>
                  Evolución de volumen y doble progresión · kg × repeticiones
                </caption>
                <thead>
                  <tr>
                    <th>Sesión</th>
                    <th>Volumen</th>
                    <th>Carga externa · kg</th>
                    <th>Reps / series</th>
                    <th>Fatiga basal</th>
                    <th>Doble progresión</th>
                  </tr>
                </thead>
                <tbody>
                  {comparable.map((g) => {
                    const session = g.session;
                    const baseline = data.baselines.find(
                      (b) => b.id === g.session.baseline_id,
                    );
                    return (
                      <tr key={g.session.id}>
                        <td>
                          {new Date(g.session.started_at).toLocaleDateString(
                            "es-CL",
                            { timeZone: "America/Santiago" },
                          )}
                        </td>
                        <td>{g.volume.toFixed(1)}</td>
                        <td>
                          {g.loadMin === g.loadMax
                            ? g.loadMin
                            : `${g.loadMin}–${g.loadMax}`}
                        </td>
                        <td>
                          {g.reps} / {g.sets}
                        </td>
                        <td>
                          {session.baseline_snapshot?.fatigue ??
                            baseline?.fatigue ??
                            "—"}{" "}
                          / 10
                        </td>
                        <td>
                          {g.target
                            ? "Límite de reps y RIR alcanzado en todas las series con carga uniforme. Revisar progresión."
                            : "Continuar registro y revisión personal."}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="correctives-muted">
              La tabla relaciona autorreporte y rendimiento de forma
              descriptiva. No estima causalidad ni prescribe aumentos de carga.
            </p>
          </>
        ) : (
          <p>
            Aún no hay sesiones terminadas con cargas en kg. Registra y finaliza
            una sesión para ver tu evolución.
          </p>
        )}
      </section>
      <section className="correctives-panel correctives-stack">
        <h2>Historial de sesiones</h2>
        {data.sessions.length === 0 && <p>Tu primera sesión aparecerá aquí.</p>}
        {data.sessions.map((session) => (
          <details key={session.id}>
            <summary>
              {new Date(session.started_at).toLocaleString("es-CL", {
                timeZone: "America/Santiago",
              })}{" "}
              · {session.status === "active" ? "En curso" : "Terminada"} ·{" "}
              {data.sets.filter((s) => s.session_id === session.id).length}{" "}
              series
            </summary>
            {session.baseline_snapshot && (
              <p>
                Evaluación al inicio: fatiga {session.baseline_snapshot.fatigue}
                /10 · sueño {session.baseline_snapshot.sleep_hours} h ·
                eficiencia{" "}
                {session.baseline_snapshot.sleep_efficiency == null
                  ? "sin registrar"
                  : `${session.baseline_snapshot.sleep_efficiency}%`}{" "}
                · dolor {session.baseline_snapshot.pain}/10 (
                {session.baseline_snapshot.pain_segment}) ·{" "}
                {session.baseline_snapshot.respiratory} ·{" "}
                {session.baseline_snapshot.shift}
                {session.baseline_snapshot.notes
                  ? ` · ${session.baseline_snapshot.notes}`
                  : ""}
              </p>
            )}
            <ul className="correctives-set-list">
              {data.sets
                .filter((s) => s.session_id === session.id)
                .map((s) => (
                  <li key={s.id}>
                    {library.find((e) => e.id === s.exercise)?.name} · serie{" "}
                    {s.ordinal} · {s.reps} reps · RIR {s.rir} ·{" "}
                    {s.load_type === "kg" ? `${s.load} kg` : s.load_type} ·{" "}
                    {s.equipment}
                    {s.quality ? ` · ${s.quality}` : ""}
                  </li>
                ))}
            </ul>
          </details>
        ))}
      </section>
    </div>
  );
}
