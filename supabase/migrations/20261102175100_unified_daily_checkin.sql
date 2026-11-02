-- One daily form. Clinical additions remain owner-only, separate from coach summaries.
create table public.readiness_clinical (
 user_id uuid not null references auth.users(id) on delete cascade, log_date date not null,
 fatigue_perceived smallint check(fatigue_perceived between 0 and 10),
 sleep_efficiency numeric check(sleep_efficiency between 0 and 100),
 pain_segment text check(length(pain_segment)<=80), pain_nrs smallint check(pain_nrs between 0 and 10),
 respiratory text check(respiratory in ('Sin síntomas','Tos','Disnea','Otros')),
 primary key(user_id,log_date),
 check(pain_nrs is null or pain_nrs=0 or nullif(trim(pain_segment),'') is not null)
);
alter table public.readiness_clinical enable row level security;
revoke all on public.readiness_clinical from public,anon,authenticated;
grant select,insert,update on public.readiness_clinical to authenticated;
grant all on public.readiness_clinical to service_role;
create policy owner_access on public.readiness_clinical for all to authenticated
 using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
-- Preserve evaluations already entered in the former corrective check-in.
insert into public.readiness_clinical(user_id,log_date,fatigue_perceived,sleep_efficiency,pain_segment,pain_nrs,respiratory)
select user_id,day,fatigue,sleep_efficiency,pain_segment,pain,respiratory from public.corrective_baselines
on conflict(user_id,log_date) do nothing;

create function public.save_daily_checkin(p jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare r public.readiness_logs; c public.readiness_clinical; x jsonb;
begin
 if auth.uid() is null then raise exception 'Not authenticated'; end if;
 if (p->>'sleep_hours')::numeric not between 0 and 24 or length(p->>'notes')>4000 then raise exception 'Invalid check-in'; end if;
 insert into public.readiness_logs(user_id,log_date,shift_type,will_train,sleep_hours,sleep_quality,stress_level,muscle_soreness,energy_level,notes)
 values(auth.uid(),(p->>'log_date')::date,p->>'shift_type',(p->>'will_train')::boolean,(p->>'sleep_hours')::numeric,(p->>'sleep_quality')::smallint,(p->>'stress_level')::smallint,(p->>'muscle_soreness')::smallint,(p->>'energy_level')::smallint,p->>'notes')
 on conflict(user_id,log_date) do update set
 shift_type=excluded.shift_type,will_train=excluded.will_train,
 sleep_hours=case when p?'sleep_hours' then excluded.sleep_hours else readiness_logs.sleep_hours end,
 sleep_quality=case when p?'sleep_quality' then excluded.sleep_quality else readiness_logs.sleep_quality end,
 stress_level=case when p?'stress_level' then excluded.stress_level else readiness_logs.stress_level end,
 muscle_soreness=case when p?'muscle_soreness' then excluded.muscle_soreness else readiness_logs.muscle_soreness end,
 energy_level=case when p?'energy_level' then excluded.energy_level else readiness_logs.energy_level end,
 notes=case when p?'notes' then excluded.notes else readiness_logs.notes end
 returning * into r;
 if p?'clinical' then
  x:=p->'clinical';
  insert into public.readiness_clinical(user_id,log_date,fatigue_perceived,sleep_efficiency,pain_segment,pain_nrs,respiratory)
  values(auth.uid(),r.log_date,(x->>'fatigue_perceived')::smallint,(x->>'sleep_efficiency')::numeric,x->>'pain_segment',(x->>'pain_nrs')::smallint,x->>'respiratory')
  on conflict(user_id,log_date) do update set
  fatigue_perceived=case when x?'fatigue_perceived' then excluded.fatigue_perceived else readiness_clinical.fatigue_perceived end,
  sleep_efficiency=case when x?'sleep_efficiency' then excluded.sleep_efficiency else readiness_clinical.sleep_efficiency end,
  pain_segment=case when x?'pain_segment' then excluded.pain_segment else readiness_clinical.pain_segment end,
  pain_nrs=case when x?'pain_nrs' then excluded.pain_nrs else readiness_clinical.pain_nrs end,
  respiratory=case when x?'respiratory' then excluded.respiratory else readiness_clinical.respiratory end
  returning * into c;
 else
  select * into c from public.readiness_clinical where user_id=auth.uid() and log_date=r.log_date;
 end if;
 return jsonb_build_object('readiness',to_jsonb(r),'clinical',to_jsonb(c));
end $$;
revoke all on function public.save_daily_checkin(jsonb) from public,anon;
grant execute on function public.save_daily_checkin(jsonb) to authenticated;

create or replace function public.corrective_valid_plan(p jsonb) returns boolean language plpgsql immutable set search_path = '' as $$
declare e jsonb; seen text[] := '{}';
begin
 if jsonb_typeof(p) <> 'array' or jsonb_array_length(p) not between 1 and 20 then return false; end if;
 for e in select * from jsonb_array_elements(p) loop
  if not (e ?& array['exercise','sets','repsMin','repsMax','rir','rest','tempo']) then return false; end if;
  if e->>'exercise' not in ('press-mancuernas','flexion-pared','remo-polea','remo-banda','sentadilla-goblet','sentarse-levantarse','peso-muerto','puente','basculacion-pelvica','deslizamiento-talon','bird-dog-corto') or (e->>'exercise') = any(seen) then return false; end if;
  seen := array_append(seen,e->>'exercise');
  if (e->>'sets')::numeric not between 1 and 10 or (e->>'sets')::numeric <> trunc((e->>'sets')::numeric)
   or (e->>'repsMin')::numeric not between 1 and 100 or (e->>'repsMin')::numeric <> trunc((e->>'repsMin')::numeric)
   or (e->>'repsMax')::numeric not between (e->>'repsMin')::numeric and 100 or (e->>'repsMax')::numeric <> trunc((e->>'repsMax')::numeric)
   or (e->>'rir')::numeric not between 0 and 10 or (e->>'rir')::numeric <> trunc((e->>'rir')::numeric)
   or (e->>'rest')::numeric not between 0 and 1800 or (e->>'rest')::numeric <> trunc((e->>'rest')::numeric)
   or e->>'tempo' !~ '^\d{1,2}-\d{1,2}-\d{1,2}-\d{1,2}$' then return false; end if;
  if exists(select 1 from jsonb_each(e) x where x.value = 'null'::jsonb) then return false; end if;
 end loop;
 return true;
exception when others then return false;
end $$;
