"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "rest-timer-v1";

interface RestTimerState {
  endAt: number;
  totalSeconds: number;
  label: string;
}

interface RestTimerContextValue {
  secondsLeft: number | null;
  totalSeconds: number | null;
  label: string | null;
  /** Arranca (o reemplaza) el descanso global. Sobrevive a la navegación entre páginas y a recargas. */
  start: (seconds: number, label: string) => void;
  adjust: (deltaSeconds: number) => void;
  skip: () => void;
}

const RestTimerContext = createContext<RestTimerContextValue | null>(null);

// --- Store externo mínimo sobre localStorage (vía useSyncExternalStore) ---------------
// Así el estado sobrevive a que el componente que arrancó el timer se desmonte
// (navegar a otra pantalla) y a recargas de página, sin llamar setState dentro de un
// efecto para "hidratar" — useSyncExternalStore es el patrón correcto de React para
// sincronizar con una fuente externa como localStorage.

type Listener = () => void;
let listeners: Listener[] = [];
let cachedRaw: string | null | undefined;
let cachedState: RestTimerState | null = null;

function parseState(raw: string | null): RestTimerState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as RestTimerState;
    if (typeof parsed.endAt !== "number" || parsed.endAt <= Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function getSnapshot(): RestTimerState | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedState;
  cachedRaw = raw;
  cachedState = parseState(raw);
  return cachedState;
}

function getServerSnapshot(): RestTimerState | null {
  return null;
}

function subscribe(listener: Listener) {
  listeners.push(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
    window.removeEventListener("storage", listener);
  };
}

function writeState(next: RestTimerState | null) {
  try {
    if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage no disponible (modo privado, cuota) — igual notificamos a los listeners en memoria.
  }
  cachedRaw = next ? JSON.stringify(next) : null;
  cachedState = next;
  listeners.forEach((l) => l());
}

function playChime() {
  try {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    // Dos tonos ascendentes cortos — reconocible sin ser una alarma molesta.
    [660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.16;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.35, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.32);
    });
    setTimeout(() => ctx.close().catch(() => {}), 800);
  } catch {
    // Web Audio no disponible — silencioso, no es crítico.
  }
}

export function RestTimerProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [now, setNow] = useState(() => Date.now());
  const chimedRef = useRef(false);

  useEffect(() => {
    if (!state) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [state]);

  const secondsLeft = state ? Math.max(0, Math.round((state.endAt - now) / 1000)) : null;

  useEffect(() => {
    if (secondsLeft === 0 && !chimedRef.current) {
      chimedRef.current = true;
      playChime();
      if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
    }
  }, [secondsLeft]);

  const start = useCallback((seconds: number, label: string) => {
    chimedRef.current = false;
    writeState({ endAt: Date.now() + seconds * 1000, totalSeconds: seconds, label });
    setNow(Date.now());
  }, []);

  const adjust = useCallback((deltaSeconds: number) => {
    const current = getSnapshot();
    if (!current) return;
    writeState({ ...current, endAt: Math.max(Date.now(), current.endAt + deltaSeconds * 1000) });
  }, []);

  const skip = useCallback(() => {
    chimedRef.current = false;
    writeState(null);
  }, []);

  return (
    <RestTimerContext.Provider
      value={{ secondsLeft, totalSeconds: state?.totalSeconds ?? null, label: state?.label ?? null, start, adjust, skip }}
    >
      {children}
    </RestTimerContext.Provider>
  );
}

export function useRestTimer() {
  const ctx = useContext(RestTimerContext);
  if (!ctx) throw new Error("useRestTimer debe usarse dentro de RestTimerProvider");
  return ctx;
}
