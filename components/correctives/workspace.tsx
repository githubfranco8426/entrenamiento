"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  ChartNoAxesCombined,
  ClipboardList,
  Moon,
  Sun,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BaselineForm, PlanEditor } from "./forms";
import { SessionLogger } from "./logger";
import { Progress } from "./progress";
import { localDay, type Workspace } from "@/lib/correctives/model";
const tabs = [
  { id: "today", label: "Hoy", icon: Activity },
  { id: "baseline", label: "Evaluación", icon: ClipboardList },
  { id: "plan", label: "Biblioteca y plan", icon: BookOpen },
  { id: "progress", label: "Evolución", icon: ChartNoAxesCombined },
] as const;
type Tab = (typeof tabs)[number]["id"];
export function CorrectiveWorkspace() {
  const [data, setData] = useState<Workspace | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("today");
  const [light, setLight] = useState(false);
  const locked = useRef(false);
  const startId = useRef<string | null>(null);
  const load = useCallback(async () => {
    const response = await fetch("/api/correctivos", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error ?? "No pudimos cargar tus registros.");
    setData(result);
  }, []);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/correctivos", { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Error de conexión.");
      });
    return () => {
      cancelled = true;
    };
  }, []);
  async function refresh() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión.");
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  async function save(body: unknown) {
    if (locked.current) return false;
    locked.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/correctivos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await load();
      setNotice("Cambios confirmados en el servidor.");
      return true;
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No pudimos confirmar el guardado. Reintenta.",
      );
      return false;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  const active = data?.sessions.find((s) => s.status === "active");
  const baseline = data?.baseline?.day === localDay() ? data.baseline : null;
  async function start() {
    if (!baseline) return;
    startId.current ??= crypto.randomUUID();
    if (
      await save({ op: "start", id: startId.current, baselineId: baseline.id })
    )
      startId.current = null;
  }
  return (
    <section
      aria-label="Ejercicios correctivos"
      className={`correctives ${light ? "correctives-light" : "dark"}`}
    >
      <a className="correctives-skip" href="#correctives-content">
        Saltar al contenido
      </a>
      <div className="correctives-wrap">
        <header className="correctives-header">
          <p className="eyebrow">ENTRENAMIENTO / CONTROL MOTOR</p>
          <div className="correctives-row">
            <Button
              variant="outline"
              aria-label={
                light
                  ? "Activar modo oscuro de alto contraste"
                  : "Activar modo claro"
              }
              onClick={() => setLight((v) => !v)}
            >
              {light ? <Moon /> : <Sun />}
              <span className="correctives-desktop">
                {light ? "Oscuro" : "Claro"}
              </span>
            </Button>
          </div>
        </header>
        <div className="correctives-intro">
          <div>
            <p className="eyebrow">CONTROL MOTOR & RECUPERACIÓN</p>
            <h1>
              Ejercicios
              <br />
              <em>correctivos.</em>
            </h1>
            <p>Evalúa tu estado, ajusta tu dosis y registra lo que importa.</p>
          </div>
          <div className="correctives-date">
            <ShieldCheck aria-hidden="true" />
            <span>Bitácora privada</span>
            <strong>
              {new Intl.DateTimeFormat("es-CL", {
                timeZone: "America/Santiago",
                day: "numeric",
                month: "long",
              }).format(new Date())}
            </strong>
          </div>
        </div>
        <nav
          aria-label="Secciones de ejercicios correctivos"
          className="correctives-nav"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              aria-current={tab === t.id ? "page" : undefined}
              onClick={() => {
                setTab(t.id);
                setNotice("");
                window.scrollTo({ top: 0, behavior: "instant" });
              }}
            >
              <t.icon aria-hidden="true" />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
        <div
          id="correctives-content"
          className="correctives-stack"
          tabIndex={-1}
        >
          {error && (
            <div className="correctives-alert" role="alert">
              <p>{error}</p>
              <Button variant="outline" disabled={busy} onClick={refresh}>
                Actualizar registros
              </Button>
              <a href="/login">Volver a ingresar</a>
            </div>
          )}
          <p className="correctives-live" role="status" aria-live="polite">
            {busy ? "Confirmando cambios…" : notice}
          </p>
          {!data && !error && (
            <div className="correctives-panel" role="status">
              Cargando registros privados…
            </div>
          )}
          {data && (
            <>
              {tab === "today" && (
                <>
                  {active ? (
                    <SessionLogger
                      session={active}
                      sets={data.sets}
                      save={save}
                      busy={busy}
                    />
                  ) : (
                    <>
                      <section className="correctives-panel correctives-daily">
                        <div>
                          <p className="eyebrow">TU SESIÓN DE HOY</p>
                          <h2>
                            Primero escucha.
                            <br />
                            Después, entrena.
                          </h2>
                          <p>
                            {baseline
                              ? "Tu evaluación está guardada. Revisa el plan antes de iniciar."
                              : "Completa tu evaluación basal para empezar una sesión."}
                          </p>
                          <div className="correctives-row">
                            <Button
                              disabled={busy || !baseline || !data.plan.length}
                              onClick={start}
                            >
                              Iniciar sesión <ArrowUpRight />
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() =>
                                setTab(baseline ? "plan" : "baseline")
                              }
                            >
                              {baseline
                                ? "Revisar prescripción"
                                : "Evaluar mi estado"}
                            </Button>
                          </div>
                          {!data.plan.length && (
                            <small>
                              Añade y guarda tu prescripción en Biblioteca y
                              plan.
                            </small>
                          )}
                        </div>
                        <Activity
                          className="correctives-hero-icon"
                          aria-hidden="true"
                        />
                      </section>
                      <div className="correctives-metrics">
                        {[
                          {
                            name: "Fatiga percibida",
                            value: baseline ? `${baseline.fatigue}/10` : "—",
                            note: "Autorreporte subjetivo",
                          },
                          {
                            name: "Sueño",
                            value: baseline ? `${baseline.sleep_hours} h` : "—",
                            note:
                              baseline?.sleep_efficiency == null
                                ? "Eficiencia no registrada"
                                : `${baseline.sleep_efficiency}% de eficiencia estimada`,
                          },
                          {
                            name: "Dolor NRS",
                            value: baseline ? `${baseline.pain}/10` : "—",
                            note:
                              baseline?.pain_segment ?? "Sin evaluación de hoy",
                          },
                          {
                            name: "Contexto",
                            value: baseline?.respiratory ?? "—",
                            note: baseline?.shift ?? "Turno pendiente",
                          },
                        ].map((m) => (
                          <section key={m.name} className="correctives-panel">
                            <h3>{m.name}</h3>
                            <strong>{m.value}</strong>
                            <p>{m.note}</p>
                          </section>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
              {tab === "baseline" && (
                <BaselineForm
                  key={baseline?.id ?? "new"}
                  value={baseline}
                  save={save}
                  busy={busy}
                />
              )}
              {tab === "plan" && (
                <PlanEditor value={data.plan} save={save} busy={busy} />
              )}
              {tab === "progress" && <Progress data={data} />}
              <footer className="correctives-footer">
                <span>Registros personales · zona horaria Chile</span>
                <div className="correctives-row">
                  <Button variant="ghost" disabled={busy} onClick={refresh}>
                    Actualizar
                  </Button>
                  <a href="/api/correctivos?export=json" download>
                    Exportar mis datos · JSON
                  </a>
                </div>
              </footer>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
