import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), user: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc: mocks.rpc }) }));
vi.mock("@/lib/supabase/get-authenticated-user", () => ({ getAuthenticatedUser: mocks.user }));
const userId = crypto.randomUUID();
const workoutId = crypto.randomUUID();
const operation = { id: crypto.randomUUID(), expectedRevision: 0, action: { kind: "finish", durationMinutes: 45 } };
function request(body: unknown = operation, owner = userId) {
  return new Request("https://example.test/api/workouts/" + workoutId + "/sync", { method: "POST", headers: { "Content-Type": "application/json", "X-Workout-User": owner }, body: JSON.stringify(body) });
}
const context = { params: Promise.resolve({ id: workoutId }) };
beforeEach(() => { vi.clearAllMocks(); mocks.user.mockResolvedValue({ id: userId }); mocks.rpc.mockResolvedValue({ data: { revision: 1 }, error: null }); });
describe("workout sync API", () => {
  it("requires the same authenticated account as the local queue", async () => {
    expect((await POST(request(operation, crypto.randomUUID()), context)).status).toBe(401);
    mocks.user.mockResolvedValue(null);
    expect((await POST(request(), context)).status).toBe(401);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("rejects invalid values before writing", async () => {
    expect((await POST(request({ ...operation, action: { kind: "finish", durationMinutes: -1 } }), context)).status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("passes the URL workout and stable operation to the atomic transaction", async () => {
    const result = await POST(request(), context);
    expect(result.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("sync_workout", { p_workout_id: workoutId, p_operation: operation });
    expect(await result.json()).toEqual({ revision: 1 });
  });
  it("returns a conflict for explicit client resolution", async () => {
    mocks.rpc.mockResolvedValue({ data: { revision: 3, conflict: true }, error: null });
    expect((await POST(request(), context)).status).toBe(409);
  });
  it("does not accept a series from another workout", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: "P0002", message: "Serie no encontrada en este entrenamiento" } });
    expect((await POST(request(), context)).status).toBe(404);
  });
});
