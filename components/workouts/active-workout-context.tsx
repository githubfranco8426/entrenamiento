"use client";

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";

const STORAGE_KEY = "active-workout-v1";

export interface ActiveWorkoutState {
  workoutId: string;
  exerciseName: string;
  /** 1-based: "Serie 2 de 4". */
  setNumber: number;
  totalSets: number;
  /** Valores por defecto de la próxima serie (los mismos que ya se muestran precargados
   * en la fila del set) — el widget los postea tal cual si el atleta confirma sin ajustar nada. */
  quickLog: {
    exerciseId: string;
    routineExerciseId: string | null;
    targetSetId: string | null;
    weightKg: number;
    reps: number;
    rpeActual: number;
  } | null;
}

interface ActiveWorkoutContextValue {
  state: ActiveWorkoutState | null;
  /** Llamado por WorkoutSession cada vez que cambia cuál es la próxima serie pendiente. */
  setActiveWorkout: (state: ActiveWorkoutState | null) => void;
}

const ActiveWorkoutContext = createContext<ActiveWorkoutContextValue | null>(null);

// Mismo patrón que rest-timer-context: un store externo mínimo sobre localStorage, así el
// widget flotante puede leer el estado en cualquier pantalla sin que el componente que lo
// escribió (la sesión de entrenamiento) siga montado.
type Listener = () => void;
let listeners: Listener[] = [];
let cachedRaw: string | null | undefined;
let cachedState: ActiveWorkoutState | null = null;

function parseState(raw: string | null): ActiveWorkoutState | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ActiveWorkoutState;
  } catch {
    return null;
  }
}

function getSnapshot(): ActiveWorkoutState | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedState;
  cachedRaw = raw;
  cachedState = parseState(raw);
  return cachedState;
}

function getServerSnapshot(): ActiveWorkoutState | null {
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

function writeState(next: ActiveWorkoutState | null) {
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

export function ActiveWorkoutProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setActiveWorkout = useCallback((next: ActiveWorkoutState | null) => {
    writeState(next);
  }, []);

  return (
    <ActiveWorkoutContext.Provider value={{ state, setActiveWorkout }}>
      {children}
    </ActiveWorkoutContext.Provider>
  );
}

export function useActiveWorkout() {
  const ctx = useContext(ActiveWorkoutContext);
  if (!ctx) throw new Error("useActiveWorkout debe usarse dentro de ActiveWorkoutProvider");
  return ctx;
}
