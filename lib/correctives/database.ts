import type { Baseline, LoggedSet, Session, Prescription } from "./model";
import type { Json } from "@/lib/types/database";

type Table<Row, Required extends keyof Row> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, Required>;
  Update: Partial<Row>;
  Relationships: [];
};
export type CorrectiveTables = {
  corrective_baselines: Table<
    Baseline & { created_at: string },
    | "user_id"
    | "day"
    | "fatigue"
    | "sleep_hours"
    | "pain_segment"
    | "pain"
    | "respiratory"
    | "shift"
  >;
  corrective_plans: Table<
    { user_id: string; plan: Prescription[]; updated_at: string },
    "user_id" | "plan"
  >;
  corrective_sessions: Table<
    Session,
    "id" | "user_id" | "baseline_id" | "baseline_snapshot" | "plan"
  >;
  corrective_sets: Table<
    LoggedSet,
    | "id"
    | "user_id"
    | "session_id"
    | "exercise"
    | "ordinal"
    | "load_type"
    | "equipment"
    | "reps"
    | "rir"
    | "rest_until"
  >;
};
export type CorrectiveFunctions = {
  corrective_start: {
    Args: { p_id: string; p_baseline: string };
    Returns: Session;
  };
  corrective_log_set: { Args: { p: Json }; Returns: LoggedSet };
  corrective_valid_plan: { Args: { p: Json }; Returns: boolean };
};
