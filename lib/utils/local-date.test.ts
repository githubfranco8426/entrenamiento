import { describe, expect, it } from "vitest";
import { localDateKey, localDayStart, localHour } from "./local-date";

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
});
