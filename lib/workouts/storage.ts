import type { SessionRecord, SessionPayload } from "./model";

const DB_NAME = "training-sessions-v1";
export const SESSION_EVENT = "training-session-change";
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("sessions", { keyPath: ["userId", "workoutId"] });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
function announce() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SESSION_EVENT));
  if (typeof BroadcastChannel !== "undefined") { const channel = new BroadcastChannel(SESSION_EVENT); channel.postMessage("changed"); channel.close(); }
}
export async function readSession(userId: string, workoutId: string): Promise<SessionRecord | undefined> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("sessions", "readonly");
    const req = tx.objectStore("sessions").get([userId, workoutId]);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}
export async function listSessions(userId: string): Promise<SessionRecord[]> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("sessions", "readonly");
    const req = tx.objectStore("sessions").getAll();
    req.onsuccess = () => resolve((req.result as SessionRecord[]).filter(r => r.userId === userId).sort((a,b) => b.updatedAt - a.updatedAt));
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}
// The read and write share one transaction: concurrent tabs never overwrite the queue.
export async function changeSession(userId: string, workoutId: string, change: (record: SessionRecord | undefined) => SessionRecord | undefined): Promise<SessionRecord | undefined> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("sessions", "readwrite");
    const store = tx.objectStore("sessions");
    const req = store.get([userId, workoutId]);
    let result: SessionRecord | undefined;
    let failure: unknown;
    req.onsuccess = () => {
      try { result = change(req.result); if (result) store.put(result); else store.delete([userId, workoutId]); }
      catch (error) { failure = error; tx.abort(); }
    };
    tx.oncomplete = () => { db.close(); announce(); resolve(result); };
    tx.onabort = tx.onerror = () => { db.close(); reject(failure ?? tx.error ?? new Error("Impossible de guardar en este dispositivo")); };
  });
}
export async function cacheSession(payload: SessionPayload) {
  const w = payload.workout;
  return changeSession(w.user_id, w.id, existing => {
    if (!existing) return { userId: w.user_id, workoutId: w.id, payload, queue: [], drafts: {}, extraExerciseIds: [], nextIndexes: {}, updatedAt: Date.now() };
    // Never replace the base under pending operations (including a lost response).
    if (!existing.queue.length && w.revision >= existing.payload.workout.revision) existing.payload = payload;
    return existing;
  });
}
