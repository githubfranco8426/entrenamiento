-- Panel Multiatleta (Fase 4a) — vínculo coach↔atleta.

create table coach_athlete_links (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references auth.users(id),
  athlete_id uuid not null references auth.users(id),
  status text not null default 'pending' check (status in ('pending', 'active', 'revoked')),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  -- Cache de display: email del atleta y del coach al momento de invitar, para
  -- no tener que resolver ids -> email vía admin API cada vez que se listan los vínculos.
  athlete_email text,
  coach_email text,
  unique (coach_id, athlete_id),
  check (coach_id <> athlete_id)
);

create index idx_coach_athlete_links_coach on coach_athlete_links(coach_id);
create index idx_coach_athlete_links_athlete on coach_athlete_links(athlete_id);

alter table coach_athlete_links enable row level security;

-- El coach ve y administra (crear/revocar) los vínculos donde es coach.
create policy "coach_manage_own_links" on coach_athlete_links
  for all
  using (auth.uid() = coach_id)
  with check (auth.uid() = coach_id);

-- El atleta ve los vínculos donde es atleta, y puede actualizarlos (aceptar/rechazar) pero no crearlos.
create policy "athlete_view_own_links" on coach_athlete_links
  for select
  using (auth.uid() = athlete_id);

create policy "athlete_respond_own_links" on coach_athlete_links
  for update
  using (auth.uid() = athlete_id)
  with check (auth.uid() = athlete_id);

-- Función compartida: ¿auth.uid() es coach activo de target_user_id?
-- security definer + search_path fijo para poder leer coach_athlete_links sin
-- depender de las políticas de quien la llama, y evitar search_path hijacking.
create or replace function is_active_coach_of(target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from coach_athlete_links
    where coach_id = auth.uid()
      and athlete_id = target_user_id
      and status = 'active'
  );
$$;

-- Solo usuarios autenticados pueden invocarla (via RLS interno o RPC directo);
-- anon no aporta nada (auth.uid() sería null) pero se revoca por higiene.
revoke execute on function is_active_coach_of(uuid) from anon;
revoke execute on function is_active_coach_of(uuid) from public;
grant execute on function is_active_coach_of(uuid) to authenticated;
