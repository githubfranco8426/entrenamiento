-- Lectura del coach sin ampliar el RLS de SELECT de las tablas base (ver plan Fase 4a):
-- una función dedicada que valida is_active_coach_of() internamente y devuelve
-- exactamente lo que la pantalla de resumen necesita.
create or replace function get_athlete_summary(target_athlete_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  result jsonb;
begin
  if not is_active_coach_of(target_athlete_id) then
    raise exception 'No autorizado';
  end if;

  select jsonb_build_object(
    'recentWorkouts', (
      select coalesce(jsonb_agg(w order by w.started_at desc), '[]'::jsonb)
      from (
        select wo.id, wo.started_at, wo.ended_at, r.title as routine_title, r.day_label
        from workouts wo
        left join routines r on r.id = wo.routine_id
        where wo.user_id = target_athlete_id
        order by wo.started_at desc
        limit 5
      ) w
    ),
    'latestReadiness', (
      select to_jsonb(rl) from readiness_logs rl
      where rl.user_id = target_athlete_id
      order by rl.log_date desc limit 1
    ),
    'latestBodyMetric', (
      select to_jsonb(bm) from body_metrics bm
      where bm.user_id = target_athlete_id
      order by bm.log_date desc limit 1
    ),
    'routineCount', (
      select count(*) from routines where user_id = target_athlete_id
    ),
    'weekSetCount', (
      select count(*) from set_logs sl
      where sl.user_id = target_athlete_id
        and sl.completed_at >= date_trunc('week', now())
    )
  ) into result;

  return result;
end;
$$;

revoke execute on function get_athlete_summary(uuid) from anon;
revoke execute on function get_athlete_summary(uuid) from public;
grant execute on function get_athlete_summary(uuid) to authenticated;
