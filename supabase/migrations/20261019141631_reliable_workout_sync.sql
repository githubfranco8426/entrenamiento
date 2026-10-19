-- Additive migration: historical sessions and sets are preserved.
alter table public.workouts add column revision integer not null default 0;
alter table public.workout_exercises add column next_set_index integer not null default 0;
update public.workout_exercises we set next_set_index = (select coalesce(max(s.set_index) + 1, 0) from public.set_logs s where s.workout_exercise_id = we.id);
create table public.workout_operations (
  user_id uuid not null references auth.users(id),
  operation_id uuid not null,
  workout_id uuid not null references public.workouts(id) on delete cascade,
  request jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, operation_id)
);
alter table public.workout_operations enable row level security;
create policy workout_operations_select on public.workout_operations for select to authenticated using ((select auth.uid()) = user_id);
create policy workout_operations_insert on public.workout_operations for insert to authenticated with check ((select auth.uid()) = user_id);
grant select, insert on public.workout_operations to authenticated;
create index workout_operations_workout on public.workout_operations(workout_id);

create or replace function public.sync_workout(p_workout_id uuid, p_operation jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
<<sync_workout>>
declare
  w public.workouts%rowtype;
  action jsonb := p_operation->'action';
  kind text := action->>'kind';
  op_id uuid := (p_operation->>'id')::uuid;
  previous public.workout_operations%rowtype;
  result jsonb;
  we_id uuid;
  set_id uuid := (action->>'setId')::uuid;
  re_id uuid := (action->>'routineExerciseId')::uuid;
  target_id uuid := (action->>'targetSetId')::uuid;
  exercise_id uuid := (action->>'exerciseId')::uuid;
  weight numeric := (action->>'weightKg')::numeric;
  reps integer := (action->>'reps')::integer;
  rpe numeric := (action->>'rpeActual')::numeric;
  set_index integer := (action->>'setIndex')::integer;
  duration integer := (action->>'durationMinutes')::integer;
begin
  if auth.uid() is null then raise exception 'No autenticado' using errcode = '42501'; end if;
  if op_id is null or p_operation->>'expectedRevision' is null or kind is null or kind not in ('log','edit','delete','finish','reopen') then
    raise exception 'Operación inválida' using errcode = '22023';
  end if;
  -- Serializes all writes for this workout, including first-time exercise creation.
  select * into w from public.workouts where id = p_workout_id and user_id = auth.uid() for update;
  if not found then raise exception 'Entrenamiento no encontrado' using errcode = 'P0002'; end if;
  select * into previous from public.workout_operations where user_id = auth.uid() and operation_id = op_id;
  if found then
    if previous.workout_id <> p_workout_id or previous.request <> p_operation then
      raise exception 'Identificador de operación reutilizado' using errcode = '22023';
    end if;
    return previous.result;
  end if;
  if w.revision <> (p_operation->>'expectedRevision')::integer then
    return jsonb_build_object('conflict', true, 'revision', w.revision, 'error', 'La sesión cambió en otra ventana o dispositivo. Revisá los cambios antes de sincronizar.');
  end if;
  if w.ended_at is not null and kind in ('log','edit','delete') then
    return jsonb_build_object('conflict', true, 'revision', w.revision, 'error', 'La sesión está finalizada. Reabrila antes de editar.');
  end if;
  if kind in ('log','edit') and (weight is null or weight < 0 or weight > 9999 or reps is null or reps < 1 or reps > 10000 or rpe is null or rpe < 5 or rpe > 10) then
    raise exception 'Valores de serie inválidos' using errcode = '22023';
  end if;
  if kind = 'log' then
    if set_id is null or exercise_id is null or set_index is null or set_index < 0 or action->>'completedAt' is null then
      raise exception 'Serie incompleta' using errcode = '22023';
    end if;
    if not exists(select 1 from public.exercises e where e.id = exercise_id and e.user_id = auth.uid()) then
      raise exception 'Ejercicio no disponible' using errcode = '22023';
    end if;
    if re_id is not null and not exists(select 1 from public.routine_exercises re where re.id = re_id and re.routine_id = w.routine_id and re.exercise_id = sync_workout.exercise_id and re.user_id = auth.uid()) then
      raise exception 'Ejercicio fuera de la rutina' using errcode = '22023';
    end if;
    if target_id is not null and not exists(select 1 from public.target_sets ts where ts.id = target_id and ts.routine_exercise_id = re_id and ts.user_id = auth.uid()) then
      raise exception 'Objetivo fuera del ejercicio' using errcode = '22023';
    end if;
    select we.id into we_id from public.workout_exercises we
      where we.workout_id = w.id and we.exercise_id = sync_workout.exercise_id and we.routine_exercise_id is not distinct from re_id and we.user_id = auth.uid()
      order by we.created_at limit 1;
    if we_id is null then
      insert into public.workout_exercises(user_id,workout_id,exercise_id,routine_exercise_id,order_index)
        values(auth.uid(),w.id,exercise_id,re_id,(select coalesce(max(we.order_index)+1,0) from public.workout_exercises we where we.workout_id=w.id)) returning id into we_id;
    end if;
    if set_index < (select we.next_set_index from public.workout_exercises we where we.id = we_id) or exists(select 1 from public.set_logs s where s.id = set_id or (s.workout_exercise_id=we_id and s.set_index=sync_workout.set_index)) then
      raise exception 'La serie ya existe; revisá el conflicto' using errcode = '22023';
    end if;
    insert into public.set_logs(id,user_id,workout_exercise_id,target_set_id,set_index,weight_kg,reps,rpe_actual,completed_at)
      values(set_id,auth.uid(),we_id,target_id,set_index,weight,reps,rpe,(action->>'completedAt')::timestamptz);
    update public.workout_exercises set next_set_index = sync_workout.set_index + 1 where id = we_id;
  elsif kind in ('edit','delete') then
    if not exists(select 1 from public.set_logs s join public.workout_exercises we on we.id=s.workout_exercise_id
      where s.id=set_id and s.user_id=auth.uid() and we.workout_id=w.id and we.user_id=auth.uid()) then
      raise exception 'Serie no encontrada en este entrenamiento' using errcode = 'P0002';
    end if;
    if kind='edit' then update public.set_logs set weight_kg=weight,reps=sync_workout.reps,rpe_actual=rpe where id=set_id;
    else delete from public.set_logs where id=set_id; end if;
  elsif kind='finish' then
    if duration is null or duration < 1 or duration > 720 then raise exception 'Duración inválida' using errcode='22023'; end if;
    update public.workouts set ended_at=started_at + make_interval(mins => duration) where id=w.id;
  elsif kind='reopen' then
    update public.workouts set ended_at=null where id=w.id;
  end if;
  update public.workouts set revision=revision+1 where id=w.id returning revision into w.revision;
  result := jsonb_build_object('revision',w.revision);
  insert into public.workout_operations(user_id,operation_id,workout_id,request,result) values(auth.uid(),op_id,w.id,p_operation,result);
  return result;
end;
$$;
revoke all on function public.sync_workout(uuid,jsonb) from public,anon;
grant execute on function public.sync_workout(uuid,jsonb) to authenticated;

create or replace function public.start_or_resume_workout(p_routine_id uuid default null)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare w public.workouts%rowtype; micro_id uuid;
begin
  if auth.uid() is null then raise exception 'No autenticado' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
  select * into w from public.workouts where user_id=auth.uid() and ended_at is null order by started_at desc limit 1;
  if found then return jsonb_build_object('workout',to_jsonb(w),'resumed',true); end if;
  if p_routine_id is not null then
    select microcycle_id into micro_id from public.routines where id=p_routine_id and user_id=auth.uid();
    if not found then raise exception 'Rutina no disponible' using errcode='22023'; end if;
  end if;
  insert into public.workouts(user_id,routine_id,microcycle_id) values(auth.uid(),p_routine_id,micro_id) returning * into w;
  return jsonb_build_object('workout',to_jsonb(w),'resumed',false);
end;
$$;
revoke all on function public.start_or_resume_workout(uuid) from public,anon;
grant execute on function public.start_or_resume_workout(uuid) to authenticated;
