-- Schema inicial: catálogo de ejercicios, periodización planificada (macro/meso/microciclo),
-- entrenamiento real (workouts/sets con RPE), readiness diario (turno 4x4), métricas corporales
-- y auditoría del motor de IA. Ver plan en C:\Users\PC\.claude\plans\misty-sprouting-summit.md

-- ── Catálogo ─────────────────────────────────────────────────────────────

create table exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  hevy_template_id text,
  name text not null,
  muscle_group text,
  equipment text,
  is_custom boolean not null default true,
  plate_increment_kg numeric(5, 2) not null default 2.5,
  created_at timestamptz not null default now(),
  unique (user_id, hevy_template_id)
);

-- Perfil y configuración de un solo usuario: objetivo, experiencia, fecha ancla del
-- ciclo de turno 4x4 (usada por lib/utils/shift-pattern.ts para autodetectar el día).
create table user_settings (
  user_id uuid primary key references auth.users(id) default auth.uid(),
  goal text,
  experience_years numeric(4, 1),
  shift_anchor_date date,
  default_plate_increment_kg numeric(5, 2) not null default 2.5,
  updated_at timestamptz not null default now()
);

-- ── Periodización planificada ────────────────────────────────────────────

create table macrocycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  name text not null,
  goal text,
  start_date date not null,
  end_date date,
  created_at timestamptz not null default now()
);

create table mesocycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  macrocycle_id uuid not null references macrocycles(id) on delete cascade,
  name text not null,
  phase text not null check (phase in ('acumulacion', 'intensificacion', 'deload', 'realizacion')),
  order_index integer not null,
  planned_weeks integer not null check (planned_weeks > 0),
  status text not null default 'planned' check (status in ('planned', 'active', 'completed')),
  created_at timestamptz not null default now()
);

create table microcycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  mesocycle_id uuid not null references mesocycles(id) on delete cascade,
  week_number integer not null check (week_number > 0),
  start_date date not null,
  end_date date not null,
  is_deload boolean not null default false,
  status text not null default 'planned' check (status in ('planned', 'active', 'completed')),
  created_at timestamptz not null default now()
);

create table routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  microcycle_id uuid references microcycles(id) on delete cascade,
  hevy_routine_id text,
  title text not null,
  day_label text,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table routine_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  routine_id uuid not null references routines(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete restrict,
  order_index integer not null,
  notes text,
  created_at timestamptz not null default now()
);

create table target_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  routine_exercise_id uuid not null references routine_exercises(id) on delete cascade,
  set_index integer not null,
  set_type text not null default 'normal' check (set_type in ('normal', 'warmup', 'dropset', 'failure', 'myo')),
  target_reps_min integer,
  target_reps_max integer,
  target_rpe numeric(3, 1) check (target_rpe is null or (target_rpe >= 5 and target_rpe <= 10)),
  target_weight_kg numeric(6, 2),
  rest_seconds integer,
  created_at timestamptz not null default now()
);

-- ── Entrenamiento real ───────────────────────────────────────────────────

create table workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  routine_id uuid references routines(id) on delete set null,
  microcycle_id uuid references microcycles(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  shift_context text check (
    shift_context is null or shift_context in (
      'dia1_diurno', 'dia2_nocturno', 'dia3_post_nocturno_descanso', 'dia4_libre'
    )
  ),
  notes text,
  created_at timestamptz not null default now()
);

create table workout_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  workout_id uuid not null references workouts(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete restrict,
  routine_exercise_id uuid references routine_exercises(id) on delete set null,
  order_index integer not null,
  created_at timestamptz not null default now()
);

create table set_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  workout_exercise_id uuid not null references workout_exercises(id) on delete cascade,
  target_set_id uuid references target_sets(id) on delete set null,
  set_index integer not null,
  set_type text not null default 'normal' check (set_type in ('normal', 'warmup', 'dropset', 'failure', 'myo')),
  weight_kg numeric(6, 2),
  reps integer,
  rpe_actual numeric(3, 1) check (rpe_actual is null or (rpe_actual >= 5 and rpe_actual <= 10)),
  rest_seconds_actual integer,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ── Readiness diario y métricas corporales ───────────────────────────────

create table readiness_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  log_date date not null,
  shift_type text not null check (
    shift_type in ('dia1_diurno', 'dia2_nocturno', 'dia3_post_nocturno_descanso', 'dia4_libre')
  ),
  will_train boolean not null default true,
  sleep_hours numeric(3, 1),
  sleep_quality smallint check (sleep_quality is null or (sleep_quality between 1 and 5)),
  stress_level smallint check (stress_level is null or (stress_level between 1 and 5)),
  muscle_soreness smallint check (muscle_soreness is null or (muscle_soreness between 1 and 5)),
  energy_level smallint check (energy_level is null or (energy_level between 1 and 5)),
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create table body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  log_date date not null,
  weight_kg numeric(5, 2),
  body_fat_pct numeric(4, 2),
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

-- ── Auditoría del motor de IA y de autoregulación ────────────────────────

create table ai_periodization_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  mesocycle_id uuid references mesocycles(id) on delete set null,
  trigger_type text not null check (trigger_type in ('end_of_microcycle', 'end_of_mesocycle', 'manual')),
  triggered_at timestamptz not null default now(),
  model_used text not null,
  input_context jsonb not null,
  raw_output jsonb,
  status text not null default 'pending_review' check (
    status in ('pending_review', 'approved', 'rejected', 'applied', 'error')
  ),
  error_message text,
  reviewed_at timestamptz,
  applied_at timestamptz,
  created_at timestamptz not null default now()
);

create table autoregulation_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  set_log_id uuid not null references set_logs(id) on delete cascade,
  target_rpe numeric(3, 1),
  actual_rpe numeric(3, 1) not null,
  suggested_weight_kg numeric(6, 2),
  suggested_reps integer,
  rationale text not null,
  created_at timestamptz not null default now()
);

-- ── Índices ──────────────────────────────────────────────────────────────

create index idx_routine_exercises_routine on routine_exercises(routine_id);
create index idx_target_sets_routine_exercise on target_sets(routine_exercise_id);
create index idx_workouts_user_started on workouts(user_id, started_at desc);
create index idx_workout_exercises_workout on workout_exercises(workout_id);
create index idx_set_logs_workout_exercise on set_logs(workout_exercise_id);
create index idx_readiness_logs_user_date on readiness_logs(user_id, log_date desc);
create index idx_body_metrics_user_date on body_metrics(user_id, log_date desc);
create index idx_microcycles_mesocycle on microcycles(mesocycle_id);
create index idx_mesocycles_macrocycle on mesocycles(macrocycle_id);
create index idx_ai_runs_user_status on ai_periodization_runs(user_id, status);

-- ── RLS: todas las tablas, scoped al usuario dueño de la fila ────────────

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'exercises', 'macrocycles', 'mesocycles', 'microcycles', 'routines',
      'routine_exercises', 'target_sets', 'workouts', 'workout_exercises',
      'set_logs', 'readiness_logs', 'body_metrics', 'ai_periodization_runs',
      'autoregulation_suggestions', 'user_settings'
    ])
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "select_own" on %I for select using ((select auth.uid()) = user_id)', t
    );
    execute format(
      'create policy "insert_own" on %I for insert with check ((select auth.uid()) = user_id)', t
    );
    execute format(
      'create policy "update_own" on %I for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t
    );
    execute format(
      'create policy "delete_own" on %I for delete using ((select auth.uid()) = user_id)', t
    );
  end loop;
end $$;
