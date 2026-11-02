-- Corrective training: owner-only records, independent of strength workouts and coach sharing.
create function public.corrective_valid_plan(p jsonb) returns boolean language plpgsql immutable set search_path = '' as $$
declare e jsonb; seen text[] := '{}';
begin
 if jsonb_typeof(p) <> 'array' or jsonb_array_length(p) not between 1 and 20 then return false; end if;
 for e in select * from jsonb_array_elements(p) loop
  if not (e ?& array['exercise','sets','repsMin','repsMax','rir','rest','tempo']) then return false; end if;
  if e->>'exercise' not in ('press-mancuernas','flexion-pared','remo-polea','remo-banda','sentadilla-goblet','sentarse-levantarse','peso-muerto','puente') or (e->>'exercise') = any(seen) then return false; end if;
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
create table public.corrective_baselines (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 day date not null, fatigue smallint not null check(fatigue between 0 and 10),
 sleep_hours numeric not null check(sleep_hours between 0 and 24), sleep_efficiency numeric check(sleep_efficiency between 0 and 100),
 pain_segment text not null check(length(trim(pain_segment)) between 1 and 80), pain smallint not null check(pain between 0 and 10),
 respiratory text not null check(respiratory in ('Sin síntomas','Tos','Disnea','Otros')),
 shift text not null check(shift in ('Sin turno','Antes de turno','Después de turno','Turno nocturno')),
 notes text not null default '' check(length(notes)<=1000), created_at timestamptz not null default now(), unique(user_id,day), unique(id,user_id)
);
create table public.corrective_plans (
 user_id uuid primary key references auth.users(id) on delete cascade, plan jsonb not null check(public.corrective_valid_plan(plan)), updated_at timestamptz not null default now()
);
create table public.corrective_sessions (
 id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
 baseline_id uuid not null, baseline_snapshot jsonb not null, plan jsonb not null check(public.corrective_valid_plan(plan)),
 status text not null default 'active' check(status in ('active','completed')),
 started_at timestamptz not null default now(), ended_at timestamptz,
 foreign key(baseline_id,user_id) references public.corrective_baselines(id,user_id), unique(id,user_id)
);
create unique index corrective_one_active on public.corrective_sessions(user_id) where status='active';
create index corrective_sessions_owner_date on public.corrective_sessions(user_id,started_at);
create table public.corrective_sets (
 id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
 session_id uuid not null, exercise text not null, ordinal smallint not null check(ordinal between 1 and 10),
 load_type text not null check(load_type in ('kg','banda','corporal')), load numeric check(load between 0 and 1000),
 equipment text not null check(length(trim(equipment)) between 1 and 100), reps smallint not null check(reps between 1 and 100),
 rir smallint not null check(rir between 0 and 10), quality text check(quality in ('Fluida','Compensación','Interrumpida')),
 created_at timestamptz not null default now(), rest_until timestamptz not null,
 check((load_type='kg' and load is not null) or (load_type<>'kg' and load is null)),
 foreign key(session_id,user_id) references public.corrective_sessions(id,user_id) on delete cascade, unique(session_id,exercise,ordinal)
);
create index corrective_sets_owner on public.corrective_sets(user_id,session_id);
do $$ declare t text; begin
 foreach t in array array['corrective_baselines','corrective_plans','corrective_sessions','corrective_sets'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public, anon, authenticated',t);
  execute format('grant select, insert on public.%I to authenticated',t);
  execute format('create policy owner_access on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))',t);
 end loop;
end $$;
grant update on public.corrective_baselines, public.corrective_plans to authenticated;
grant update(status,ended_at) on public.corrective_sessions to authenticated;
grant all on public.corrective_baselines,public.corrective_plans,public.corrective_sessions,public.corrective_sets to service_role;

-- Serialize set writes with completion. Also protects direct REST inserts.
create function public.corrective_check_set() returns trigger language plpgsql security invoker set search_path = '' as $$
declare s public.corrective_sessions; p jsonb;
begin
 select * into s from public.corrective_sessions where id=new.session_id and user_id=(select auth.uid()) for update;
 if not found or s.status <> 'active' then raise exception 'Session unavailable'; end if;
 select e into p from jsonb_array_elements(s.plan) e where e->>'exercise'=new.exercise;
 if p is null or new.ordinal > (p->>'sets')::int then raise exception 'Set outside prescription'; end if;
 new.created_at := clock_timestamp();
 new.rest_until := new.created_at + make_interval(secs => (p->>'rest')::int);
 return new;
end $$;
create trigger corrective_set_guard before insert on public.corrective_sets for each row execute function public.corrective_check_set();

create function public.corrective_log_set(p jsonb) returns public.corrective_sets language plpgsql security invoker set search_path = '' as $$
declare s public.corrective_sets; session_status text;
begin
 select status into session_status from public.corrective_sessions where id=(p->>'session_id')::uuid and user_id=(select auth.uid()) for update;
 if not found then raise exception 'Session unavailable'; end if;
 select * into s from public.corrective_sets where id=(p->>'id')::uuid;
 if found then
  if jsonb_build_object('id',s.id,'session_id',s.session_id,'exercise',s.exercise,'ordinal',s.ordinal,'load_type',s.load_type,'load',s.load,'equipment',s.equipment,'reps',s.reps,'rir',s.rir,'quality',s.quality) <> p then raise exception 'Idempotency conflict'; end if;
  return s;
 end if;
 insert into public.corrective_sets(id,user_id,session_id,exercise,ordinal,load_type,load,equipment,reps,rir,quality,rest_until)
 values((p->>'id')::uuid,auth.uid(),(p->>'session_id')::uuid,p->>'exercise',(p->>'ordinal')::smallint,p->>'load_type',(p->>'load')::numeric,p->>'equipment',(p->>'reps')::smallint,(p->>'rir')::smallint,p->>'quality',now()) returning * into s;
 return s;
end $$;

create function public.corrective_start(p_id uuid,p_baseline uuid) returns public.corrective_sessions language plpgsql security invoker set search_path = '' as $$
declare s public.corrective_sessions; p jsonb;
begin
 if auth.uid() is null then raise exception 'Access denied'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select * into s from public.corrective_sessions where user_id=auth.uid() and (id=p_id or status='active') order by started_at desc limit 1;
 if found then return s; end if;
 if not exists(select 1 from public.corrective_baselines where id=p_baseline and user_id=auth.uid() and day=(now() at time zone 'America/Santiago')::date) then raise exception 'Evaluate today before starting'; end if;
 select plan into p from public.corrective_plans where user_id=auth.uid();
 insert into public.corrective_sessions(id,user_id,baseline_id,baseline_snapshot,plan) select p_id,auth.uid(),p_baseline,to_jsonb(b),p from public.corrective_baselines b where b.id=p_baseline and b.user_id=auth.uid() returning * into s;
 return s;
end $$;
revoke all on function public.corrective_start(uuid,uuid),public.corrective_log_set(jsonb),public.corrective_check_set(),public.corrective_valid_plan(jsonb) from public,anon;
grant execute on function public.corrective_start(uuid,uuid),public.corrective_log_set(jsonb),public.corrective_valid_plan(jsonb) to authenticated;
