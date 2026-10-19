"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
export interface NextSetPrescription { weightKg: number | null; repsMin: number | null; repsMax: number | null; rir: number | null }
interface State { endAt: number; totalSeconds: number; label: string; note: string | null; cue: string | null; nextSet: NextSetPrescription | null; paused: boolean; pausedRemainingSeconds: number | null; minimized: boolean }
function timerStore(userId: string) {
  const key = "rest-timer-v2:" + userId;
  let raw: string | null | undefined;
  let cached: State | null = null;
  const listeners = new Set<() => void>();
  return {
    get() {
      let next: string | null;
      try { next = localStorage.getItem(key); } catch { return cached; }
      if (next !== raw) {
        raw = next;
        try { const parsed = next ? JSON.parse(next) : null; cached = parsed && Number.isFinite(parsed.endAt) ? parsed : null; }
        catch { cached = null; }
      }
      return cached;
    },
    set(value: State | null) {
      cached = value; raw = value ? JSON.stringify(value) : null;
      try { if (raw) localStorage.setItem(key,raw); else localStorage.removeItem(key); } catch {}
      listeners.forEach(fn => fn());
    },
    subscribe(fn: () => void) { listeners.add(fn); window.addEventListener("storage",fn); return () => { listeners.delete(fn); window.removeEventListener("storage",fn); }; },
  };
}
interface Value {
  secondsLeft: number | null; totalSeconds: number | null; label: string | null; note: string | null; cue: string | null; nextSet: NextSetPrescription | null; paused: boolean; minimized: boolean;
  start: (seconds: number, label: string, extra?: {cue?: string | null; nextSet?: NextSetPrescription | null}) => void;
  setNote: (note: string | null) => void; adjust: (delta: number) => void; togglePause: () => void; toggleMinimized: () => void; skip: () => void;
}
const Context = createContext<Value | null>(null);
export function RestTimerProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const store = useMemo(() => timerStore(userId), [userId]);
  const state = useSyncExternalStore(store.subscribe, store.get, () => null);
  const [now,setNow] = useState(() => Date.now());
  const chimed = useRef<number | null>(null);
  useEffect(() => {
    const receive = (event: Event) => {
      const { userId: owner, label, note } = (event as CustomEvent).detail;
      const current = store.get();
      if (owner === userId && current && current.label === label) store.set({ ...current, note });
    };
    window.addEventListener("workout-suggestion", receive);
    return () => window.removeEventListener("workout-suggestion", receive);
  }, [store, userId]);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const interval = setInterval(tick,1000);
    window.addEventListener("focus",tick); document.addEventListener("visibilitychange",tick);
    return () => { clearInterval(interval); window.removeEventListener("focus",tick); document.removeEventListener("visibilitychange",tick); };
  },[]);
  const secondsLeft = state ? state.paused ? state.pausedRemainingSeconds ?? 0 : Math.max(0,Math.ceil((state.endAt-now)/1000)) : null;
  useEffect(() => {
    if (state && secondsLeft === 0 && chimed.current !== state.endAt) {
      chimed.current = state.endAt;
      navigator.vibrate?.([120,60,120]);
      try {
        const audio = new AudioContext(); const oscillator = audio.createOscillator(); const gain = audio.createGain();
        oscillator.connect(gain); gain.connect(audio.destination); gain.gain.value = 0.1; oscillator.frequency.value = 880;
        oscillator.start(); oscillator.stop(audio.currentTime + 0.2); oscillator.onended = () => { void audio.close(); };
      } catch {}
    }
  },[secondsLeft,state]);
  const start = useCallback((seconds: number, label: string, extra?: {cue?: string | null; nextSet?: NextSetPrescription | null}) => {
    store.set({endAt: Date.now()+seconds*1000,totalSeconds:seconds,label,note:null,cue:extra?.cue??null,nextSet:extra?.nextSet??null,paused:false,pausedRemainingSeconds:null,minimized:true}); setNow(Date.now());
  },[store]);
  return <Context.Provider value={{
    secondsLeft, totalSeconds:state?.totalSeconds??null,label:state?.label??null,note:state?.note??null,cue:state?.cue??null,nextSet:state?.nextSet??null,paused:state?.paused??false,minimized:state?.minimized??true,start,
    setNote(note) { const current=store.get(); if(current) store.set({...current,note}); },
    adjust(delta) { const current=store.get(); if(current) store.set(current.paused ? {...current,pausedRemainingSeconds:Math.max(0,(current.pausedRemainingSeconds??0)+delta)} : {...current,endAt:Math.max(Date.now(),current.endAt+delta*1000)}); },
    togglePause() { const current=store.get(); if(current) store.set(current.paused ? {...current,paused:false,endAt:Date.now()+(current.pausedRemainingSeconds??0)*1000,pausedRemainingSeconds:null} : {...current,paused:true,pausedRemainingSeconds:Math.max(0,Math.ceil((current.endAt-Date.now())/1000))}); setNow(Date.now()); },
    toggleMinimized() { const current=store.get(); if(current) store.set({...current,minimized:!current.minimized}); },
    skip() { store.set(null); },
  }}>{children}</Context.Provider>;
}
export function useRestTimer() { const value=useContext(Context); if(!value) throw new Error("Falta RestTimerProvider"); return value; }
