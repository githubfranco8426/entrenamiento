"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, ChartNoAxesCombined, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanEditor } from "./forms";
import { SessionLogger } from "./logger";
import { Progress } from "./progress";
import type { Workspace } from "@/lib/correctives/model";
import { CorrectiveRoutine } from "./routine";
import { lumbarRoutine } from "@/lib/correctives/routine";
const tabs = [
  { id: "routine", label: "Mi rutina", icon: BookOpen },
  { id: "plan", label: "Biblioteca y plan", icon: BookOpen },
  { id: "progress", label: "Evolución", icon: ChartNoAxesCombined },
] as const;
type Tab = (typeof tabs)[number]["id"];
export function CorrectiveWorkspace() {
  const [data, setData] = useState<Workspace | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("routine");
  const locked = useRef(false);
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
  return (
    <section aria-label="Ejercicios correctivos" className="correctives">
      <a className="correctives-skip" href="#correctives-content">
        Saltar al contenido
      </a>
      <div className="correctives-wrap">
        <div className="correctives-intro">
          <div>
            <p className="eyebrow">CONTROL MOTOR & RECUPERACIÓN</p>
            <h1>Ejercicios correctivos</h1>
            <p>
              Control lumbopélvico para hiperlordosis. Tu chequeo diario está en
              Inicio.
            </p>
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
              {tab === "routine" && (
                <CorrectiveRoutine
                  plan={data.plan}
                  edit={() => setTab("plan")}
                />
              )}
              {tab === "routine" && active && (
                <details>
                  <summary>Recuperar una sesión ya abierta</summary>
                  <SessionLogger
                    session={active}
                    sets={data.sets}
                    save={save}
                    busy={busy}
                  />
                </details>
              )}
              {tab === "plan" && (
                <PlanEditor
                  value={data.plan.length ? data.plan : lumbarRoutine}
                  save={save}
                  busy={busy}
                />
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
