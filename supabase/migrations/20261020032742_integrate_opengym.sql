-- OpenGym module state. SECURITY INVOKER preserves all existing ownership policies.
create table public.opengym_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
 state jsonb not null default '{}'::jsonb check (jsonb_typeof(state) = 'object'),
 revision bigint not null default 0,
 coach_pending jsonb,
 coach_last_requested_at timestamptz,
 published_ids jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now(),
 check (octet_length(state::text) <= 4194304)
);
alter table public.opengym_profiles enable row level security;
create policy "Own OpenGym profile" on public.opengym_profiles for all to authenticated
 using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
revoke all on public.opengym_profiles from anon;
grant select, insert, update, delete on public.opengym_profiles to authenticated;

create function public.save_opengym_state(p_state jsonb, p_revision bigint)
returns bigint language plpgsql security invoker set search_path = '' as $$
declare result bigint;
begin
 if auth.uid() is null then raise exception 'No autenticado' using errcode='42501'; end if;
 insert into public.opengym_profiles(user_id) values (auth.uid()) on conflict do nothing;
 update public.opengym_profiles set state=p_state,revision=revision+1,updated_at=now()
 where user_id=auth.uid() and revision=p_revision returning revision into result;
 if result is null then raise exception 'Conflicto de sincronización' using errcode='40001'; end if;
 return result;
end; $$;
revoke all on function public.save_opengym_state(jsonb,bigint) from public, anon;
grant execute on function public.save_opengym_state(jsonb,bigint) to authenticated;

create function public.publish_opengym(p_records jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare counts jsonb := '{}'::jsonb; n integer;
begin
 if auth.uid() is null then raise exception 'No autenticado' using errcode='42501'; end if;
 perform 1 from public.opengym_profiles where user_id=auth.uid() for update;
 if not found then raise exception 'Abre OpenGym primero'; end if;
 insert into public.exercises(id,name,muscle_group,equipment,user_id)
 select id,name,muscle_group,equipment,auth.uid() from jsonb_populate_recordset(null::public.exercises,coalesce(p_records->'exercises','[]'::jsonb))
 on conflict (id) do update set name=excluded.name,muscle_group=excluded.muscle_group,equipment=excluded.equipment where exercises.user_id=auth.uid();
 get diagnostics n = row_count; counts := counts || jsonb_build_object('exercises',n);
 insert into public.routines(id,title,order_index,user_id)
 select id,title,order_index,auth.uid() from jsonb_populate_recordset(null::public.routines,coalesce(p_records->'routines','[]'::jsonb))
 on conflict (id) do update set title=excluded.title,order_index=excluded.order_index where routines.user_id=auth.uid();
 get diagnostics n = row_count; counts := counts || jsonb_build_object('routines',n);
 delete from public.target_sets t using public.routine_exercises e
 where t.routine_exercise_id=e.id and t.user_id=auth.uid() and e.user_id=auth.uid()
 and e.routine_id in (select (v->>'id')::uuid from jsonb_array_elements(p_records->'routines') v)
 and t.id not in (select (v->>'id')::uuid from jsonb_array_elements(p_records->'target_sets') v);
 delete from public.routine_exercises e where e.user_id=auth.uid()
 and e.routine_id in (select (v->>'id')::uuid from jsonb_array_elements(p_records->'routines') v)
 and e.id not in (select (v->>'id')::uuid from jsonb_array_elements(p_records->'routine_exercises') v);
 if exists(select 1 from jsonb_array_elements(p_records->'routine_exercises') v
 where not exists(select 1 from public.routines r where r.id=(v->>'routine_id')::uuid and r.user_id=auth.uid())
 or not exists(select 1 from public.exercises e where e.id=(v->>'exercise_id')::uuid and e.user_id=auth.uid()))
 then raise exception 'Referencia ajena' using errcode='42501'; end if;
 insert into public.routine_exercises(id,routine_id,exercise_id,order_index,notes,user_id)
 select id,routine_id,exercise_id,order_index,notes,auth.uid() from jsonb_populate_recordset(null::public.routine_exercises,coalesce(p_records->'routine_exercises','[]'::jsonb))
 on conflict (id) do update set routine_id=excluded.routine_id,exercise_id=excluded.exercise_id,order_index=excluded.order_index,notes=excluded.notes where routine_exercises.user_id=auth.uid();
 get diagnostics n = row_count; counts := counts || jsonb_build_object('routine_exercises',n);
 if exists(select 1 from jsonb_array_elements(p_records->'target_sets') v where not exists(select 1 from public.routine_exercises p where p.id=(v->>'routine_exercise_id')::uuid and p.user_id=auth.uid())) then raise exception 'Referencia ajena' using errcode='42501'; end if;
 insert into public.target_sets(id,routine_exercise_id,set_index,target_reps_min,target_reps_max,target_weight_kg,user_id)
 select id,routine_exercise_id,set_index,target_reps_min,target_reps_max,target_weight_kg,auth.uid() from jsonb_populate_recordset(null::public.target_sets,coalesce(p_records->'target_sets','[]'::jsonb))
 on conflict (id) do update set routine_exercise_id=excluded.routine_exercise_id,set_index=excluded.set_index,target_reps_min=excluded.target_reps_min,target_reps_max=excluded.target_reps_max,target_weight_kg=excluded.target_weight_kg where target_sets.user_id=auth.uid();
 get diagnostics n = row_count; counts := counts || jsonb_build_object('target_sets',n);
 insert into public.workouts(id,started_at,ended_at,notes,user_id)
 select id,started_at,ended_at,notes,auth.uid() from jsonb_populate_recordset(null::public.workouts,coalesce(p_records->'workouts','[]'::jsonb))
 on conflict (id) do nothing;
 get diagnostics n = row_count; counts := counts || jsonb_build_object('workouts',n);
 if exists(select 1 from jsonb_array_elements(p_records->'workout_exercises') v
 where not exists(select 1 from public.workouts w where w.id=(v->>'workout_id')::uuid and w.user_id=auth.uid())
 or not exists(select 1 from public.exercises e where e.id=(v->>'exercise_id')::uuid and e.user_id=auth.uid()))
 then raise exception 'Referencia ajena' using errcode='42501'; end if;
 insert into public.workout_exercises(id,workout_id,exercise_id,order_index,user_id)
 select id,workout_id,exercise_id,order_index,auth.uid() from jsonb_populate_recordset(null::public.workout_exercises,coalesce(p_records->'workout_exercises','[]'::jsonb))
 on conflict (id) do nothing;
 get diagnostics n = row_count; counts := counts || jsonb_build_object('workout_exercises',n);
 if exists(select 1 from jsonb_array_elements(p_records->'set_logs') v where not exists(select 1 from public.workout_exercises p where p.id=(v->>'workout_exercise_id')::uuid and p.user_id=auth.uid())) then raise exception 'Referencia ajena' using errcode='42501'; end if;
 insert into public.set_logs(id,workout_exercise_id,set_index,weight_kg,reps,rpe_actual,completed_at,user_id)
 select id,workout_exercise_id,set_index,weight_kg,reps,rpe_actual,completed_at,auth.uid() from jsonb_populate_recordset(null::public.set_logs,coalesce(p_records->'set_logs','[]'::jsonb))
 on conflict (id) do nothing;
 get diagnostics n = row_count; counts := counts || jsonb_build_object('set_logs',n);
 insert into public.body_metrics(id,log_date,weight_kg,user_id)
 select id,log_date,weight_kg,auth.uid() from jsonb_populate_recordset(null::public.body_metrics,coalesce(p_records->'body_metrics','[]'::jsonb))
 on conflict (user_id,log_date) do nothing;
 get diagnostics n = row_count; counts := counts || jsonb_build_object('body_metrics',n);
 update public.opengym_profiles profile set published_ids=(
 select jsonb_object_agg(key,(select coalesce(jsonb_agg(distinct item),'[]'::jsonb) from (
 select v->'id' item from jsonb_array_elements(value) v
 union select v item from jsonb_array_elements(coalesce(profile.published_ids->key,'[]'::jsonb)) v
 ) merged)) from jsonb_each(p_records)
 ) where user_id=auth.uid();
 return counts;
end; $$;
revoke all on function public.publish_opengym(jsonb) from public, anon;
grant execute on function public.publish_opengym(jsonb) to authenticated;
