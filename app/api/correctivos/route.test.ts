import { beforeEach, describe, expect, it, vi } from "vitest";
const access = vi.hoisted(() => vi.fn());
vi.mock("@/lib/correctives/server", () => ({ correctiveAccess: access }));
import { GET, POST } from "./route";

const request = (body: unknown, origin = "http://localhost") =>
  new Request("http://localhost/api/correctivos", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
beforeEach(() => {
  access.mockReset();
});
describe("Corrective API boundaries", () => {
  it("requires existing app authentication and disables caching", async () => {
    access.mockResolvedValue({ db: {}, user: null });
    expect(
      (await GET(new Request("http://localhost/api/correctivos"))).status,
    ).toBe(401);
    const response = await POST(
      request({ op: "finish", id: crypto.randomUUID() }),
    );
    expect(response.status).toBe(401);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
  });
  it("rejects cross-origin writes before opening the database", async () => {
    const response = await POST(request({}, "https://unrelated.example"));
    expect(response.status).toBe(403);
    expect(access).not.toHaveBeenCalled();
  });
  it("rejects invalid prescription without making a data call", async () => {
    const from = vi.fn();
    access.mockResolvedValue({
      db: { from },
      user: { id: crypto.randomUUID() },
    });
    const response = await POST(request({ op: "plan", data: [] }));
    expect(response.status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });
  it("reports unavailable storage without exposing internal data", async () => {
    access.mockRejectedValue(new Error("sensitive internal detail"));
    const response = await GET(new Request("http://localhost/api/correctivos"));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("sensitive internal detail");
  });
});
