import { describe, expect, it } from "vitest";
import { latestWeightByExercise } from "./latest-weights";

describe("latestWeightByExercise", () => {
  it("selects the most recent load across workouts, rather than the largest load", () => {
    expect(latestWeightByExercise([
      { exercise_id: "row", set_logs: [{ weight_kg: 50, completed_at: "2026-10-27T12:00:00Z" }] },
      { exercise_id: "bench", set_logs: [{ weight_kg: 80, completed_at: "2026-10-26T10:00:00Z" }] },
      { exercise_id: "bench", set_logs: [{ weight_kg: 75, completed_at: "2026-10-27T10:00:00Z" }] },
    ])).toEqual(new Map([["row", 50], ["bench", 75]]));
  });
  it("retains zero load and skips null or missing sets", () => {
    expect(latestWeightByExercise([
      { exercise_id: "dip", set_logs: [{ weight_kg: 0, completed_at: "2026-10-27T10:00:00Z" }] },
      { exercise_id: "dip", set_logs: [{ weight_kg: null, completed_at: "2026-10-28T10:00:00Z" }] },
      { exercise_id: "row", set_logs: null },
    ])).toEqual(new Map([["dip", 0]]));
  });
  it("compares actual instants across time zones", () => {
    expect(latestWeightByExercise([
      { exercise_id: "row", set_logs: [{ weight_kg: 40, completed_at: "2026-10-27T12:00:00Z" }, { weight_kg: 45, completed_at: "2026-10-27T10:00:00-03:00" }] },
    ]).get("row")).toBe(45);
  });
});
