import { describe, expect, it } from "vitest";
import { localDateKey, localDayStart, localHour, localDateTime } from "./local-date";

describe("Chile calendar dates", () => {
  it("keeps Thursday at night when the UTC server is already on Friday", () => {
    const now = new Date("2026-10-09T01:45:00Z");
    expect(localDateKey(now)).toBe("2026-10-08");
    expect(localHour(now)).toBe(22);
  });
  it("changes day at Chile midnight", () => {
    expect(localDateKey("2026-10-09T02:59:59Z")).toBe("2026-10-08");
    expect(localDateKey("2026-10-09T03:00:00Z")).toBe("2026-10-09");
  });
  it("uses the appropriate summer and winter offsets for database ranges", () => {
    expect(localDayStart("2026-10-08")).toBe("2026-10-08T03:00:00.000Z");
    expect(localDayStart("2026-07-08")).toBe("2026-07-08T04:00:00.000Z");
  });
  it("formats session details in Chile regardless of the host time zone", () => {
    expect(localDateTime("2026-10-17T14:28:00Z")).toContain("11:28");
    expect(localDateTime("2026-07-17T14:28:00Z")).toContain("10:28");
    expect(localDateKey("2026-09-06T03:59:59Z")).toBe("2026-09-05");
    expect(localDateKey("2026-09-06T04:00:00Z")).toBe("2026-09-06");
  });
});
