import { describe, expect, it, vi } from "vitest";
import { getRoutineScope } from "./routine-scope";

function client(data: unknown, error: { message: string } | null = null) {
  const query = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn().mockResolvedValue({ data, error }) };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  const from = vi.fn().mockReturnValue(query);
  return { from, supabase: { from } as unknown as Parameters<typeof getRoutineScope>[0] };
}

describe("routine scope", () => {
  it("uses the active week when it contains routines, in one database request", async () => {
    const c = client({ id: "week-3", routines: [{ id: "torso" }] });
    expect(await getRoutineScope(c.supabase)).toBe("microcycle_id.eq.week-3");
    expect(c.from).toHaveBeenCalledTimes(1);
  });
  it.each([null, { id: "week-3", routines: [] }])("preserves the unassigned fallback for %j", async (active) => {
    expect(await getRoutineScope(client(active).supabase)).toBe("microcycle_id.is.null");
  });
  it("does not silently fall back after a database error", async () => {
    await expect(getRoutineScope(client(null, { message: "request failed" }).supabase)).rejects.toThrow("request failed");
  });
});
