// Tipos generados desde el schema real de supabase/migrations/*.sql vía
// `mcp__plugin_supabase_supabase__generate_typescript_types` (proyecto "saveplata",
// ref rwwuvvhwdexqjvxgbqkb, reutilizado para esta app). Las columnas con check
// constraints (phase, status, set_type, shift_type, trigger_type, etc.) se
// devuelven como `string` desde el generador — acá se acotan a los union types
// reales para que el resto del código (autoregulation, ai/*) tenga tipado fino.
// Si se corre supabase gen types de nuevo, hay que reaplicar esas uniones.

export type SetType = "normal" | "warmup" | "dropset" | "failure" | "myo";
export type MesocyclePhase = "acumulacion" | "intensificacion" | "deload" | "realizacion";
export type CycleStatus = "planned" | "active" | "completed";
export type ShiftType =
  | "dia1_diurno"
  | "dia2_nocturno"
  | "dia3_post_nocturno_descanso"
  | "dia4_libre";
export type AiTriggerType = "end_of_microcycle" | "end_of_mesocycle" | "manual";
export type AiRunStatus = "pending_review" | "approved" | "rejected" | "applied" | "error";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      exercises: {
        Row: {
          id: string;
          user_id: string;
          hevy_template_id: string | null;
          name: string;
          muscle_group: string | null;
          equipment: string | null;
          is_custom: boolean;
          plate_increment_kg: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["exercises"]["Row"]> & { name: string };
        Update: Partial<Database["public"]["Tables"]["exercises"]["Row"]>;
        Relationships: [];
      };
      user_settings: {
        Row: {
          user_id: string;
          goal: string | null;
          experience_years: number | null;
          shift_anchor_date: string | null;
          default_plate_increment_kg: number;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["user_settings"]["Row"]> & {
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_settings"]["Row"]>;
        Relationships: [];
      };
      macrocycles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          goal: string | null;
          start_date: string;
          end_date: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["macrocycles"]["Row"]> & {
          name: string;
          start_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["macrocycles"]["Row"]>;
        Relationships: [];
      };
      mesocycles: {
        Row: {
          id: string;
          user_id: string;
          macrocycle_id: string;
          name: string;
          phase: MesocyclePhase;
          order_index: number;
          planned_weeks: number;
          status: CycleStatus;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["mesocycles"]["Row"]> & {
          macrocycle_id: string;
          name: string;
          phase: MesocyclePhase;
          order_index: number;
          planned_weeks: number;
        };
        Update: Partial<Database["public"]["Tables"]["mesocycles"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "mesocycles_macrocycle_id_fkey";
            columns: ["macrocycle_id"];
            isOneToOne: false;
            referencedRelation: "macrocycles";
            referencedColumns: ["id"];
          },
        ];
      };
      microcycles: {
        Row: {
          id: string;
          user_id: string;
          mesocycle_id: string;
          week_number: number;
          start_date: string;
          end_date: string;
          is_deload: boolean;
          status: CycleStatus;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["microcycles"]["Row"]> & {
          mesocycle_id: string;
          week_number: number;
          start_date: string;
          end_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["microcycles"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "microcycles_mesocycle_id_fkey";
            columns: ["mesocycle_id"];
            isOneToOne: false;
            referencedRelation: "mesocycles";
            referencedColumns: ["id"];
          },
        ];
      };
      routines: {
        Row: {
          id: string;
          user_id: string;
          microcycle_id: string | null;
          hevy_routine_id: string | null;
          title: string;
          day_label: string | null;
          order_index: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["routines"]["Row"]> & { title: string };
        Update: Partial<Database["public"]["Tables"]["routines"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "routines_microcycle_id_fkey";
            columns: ["microcycle_id"];
            isOneToOne: false;
            referencedRelation: "microcycles";
            referencedColumns: ["id"];
          },
        ];
      };
      routine_exercises: {
        Row: {
          id: string;
          user_id: string;
          routine_id: string;
          exercise_id: string;
          order_index: number;
          notes: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["routine_exercises"]["Row"]> & {
          routine_id: string;
          exercise_id: string;
          order_index: number;
        };
        Update: Partial<Database["public"]["Tables"]["routine_exercises"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "routine_exercises_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "routine_exercises_routine_id_fkey";
            columns: ["routine_id"];
            isOneToOne: false;
            referencedRelation: "routines";
            referencedColumns: ["id"];
          },
        ];
      };
      target_sets: {
        Row: {
          id: string;
          user_id: string;
          routine_exercise_id: string;
          set_index: number;
          set_type: SetType;
          target_reps_min: number | null;
          target_reps_max: number | null;
          target_rpe: number | null;
          target_weight_kg: number | null;
          rest_seconds: number | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["target_sets"]["Row"]> & {
          routine_exercise_id: string;
          set_index: number;
          set_type: SetType;
        };
        Update: Partial<Database["public"]["Tables"]["target_sets"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "target_sets_routine_exercise_id_fkey";
            columns: ["routine_exercise_id"];
            isOneToOne: false;
            referencedRelation: "routine_exercises";
            referencedColumns: ["id"];
          },
        ];
      };
      workouts: {
        Row: {
          id: string;
          user_id: string;
          routine_id: string | null;
          microcycle_id: string | null;
          started_at: string;
          ended_at: string | null;
          shift_context: ShiftType | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["workouts"]["Row"]> & { started_at: string };
        Update: Partial<Database["public"]["Tables"]["workouts"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "workouts_microcycle_id_fkey";
            columns: ["microcycle_id"];
            isOneToOne: false;
            referencedRelation: "microcycles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workouts_routine_id_fkey";
            columns: ["routine_id"];
            isOneToOne: false;
            referencedRelation: "routines";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_exercises: {
        Row: {
          id: string;
          user_id: string;
          workout_id: string;
          exercise_id: string;
          routine_exercise_id: string | null;
          order_index: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["workout_exercises"]["Row"]> & {
          workout_id: string;
          exercise_id: string;
          order_index: number;
        };
        Update: Partial<Database["public"]["Tables"]["workout_exercises"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_exercises_routine_exercise_id_fkey";
            columns: ["routine_exercise_id"];
            isOneToOne: false;
            referencedRelation: "routine_exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_exercises_workout_id_fkey";
            columns: ["workout_id"];
            isOneToOne: false;
            referencedRelation: "workouts";
            referencedColumns: ["id"];
          },
        ];
      };
      set_logs: {
        Row: {
          id: string;
          user_id: string;
          workout_exercise_id: string;
          target_set_id: string | null;
          set_index: number;
          set_type: SetType;
          weight_kg: number | null;
          reps: number | null;
          rpe_actual: number | null;
          rest_seconds_actual: number | null;
          completed_at: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["set_logs"]["Row"]> & {
          workout_exercise_id: string;
          set_index: number;
          set_type: SetType;
        };
        Update: Partial<Database["public"]["Tables"]["set_logs"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "set_logs_target_set_id_fkey";
            columns: ["target_set_id"];
            isOneToOne: false;
            referencedRelation: "target_sets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "set_logs_workout_exercise_id_fkey";
            columns: ["workout_exercise_id"];
            isOneToOne: false;
            referencedRelation: "workout_exercises";
            referencedColumns: ["id"];
          },
        ];
      };
      readiness_logs: {
        Row: {
          id: string;
          user_id: string;
          log_date: string;
          shift_type: ShiftType;
          will_train: boolean;
          sleep_hours: number | null;
          sleep_quality: number | null;
          stress_level: number | null;
          muscle_soreness: number | null;
          energy_level: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["readiness_logs"]["Row"]> & {
          log_date: string;
          shift_type: ShiftType;
        };
        Update: Partial<Database["public"]["Tables"]["readiness_logs"]["Row"]>;
        Relationships: [];
      };
      body_metrics: {
        Row: {
          id: string;
          user_id: string;
          log_date: string;
          weight_kg: number | null;
          body_fat_pct: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["body_metrics"]["Row"]> & { log_date: string };
        Update: Partial<Database["public"]["Tables"]["body_metrics"]["Row"]>;
        Relationships: [];
      };
      ai_periodization_runs: {
        Row: {
          id: string;
          user_id: string;
          mesocycle_id: string | null;
          trigger_type: AiTriggerType;
          triggered_at: string;
          model_used: string;
          input_context: Json;
          raw_output: Json | null;
          status: AiRunStatus;
          error_message: string | null;
          reviewed_at: string | null;
          applied_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ai_periodization_runs"]["Row"]> & {
          trigger_type: AiTriggerType;
          model_used: string;
          input_context: Json;
        };
        Update: Partial<Database["public"]["Tables"]["ai_periodization_runs"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "ai_periodization_runs_mesocycle_id_fkey";
            columns: ["mesocycle_id"];
            isOneToOne: false;
            referencedRelation: "mesocycles";
            referencedColumns: ["id"];
          },
        ];
      };
      autoregulation_suggestions: {
        Row: {
          id: string;
          user_id: string;
          set_log_id: string;
          target_rpe: number | null;
          actual_rpe: number;
          suggested_weight_kg: number | null;
          suggested_reps: number | null;
          rationale: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["autoregulation_suggestions"]["Row"]> & {
          set_log_id: string;
          actual_rpe: number;
          rationale: string;
        };
        Update: Partial<Database["public"]["Tables"]["autoregulation_suggestions"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "autoregulation_suggestions_set_log_id_fkey";
            columns: ["set_log_id"];
            isOneToOne: false;
            referencedRelation: "set_logs";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
