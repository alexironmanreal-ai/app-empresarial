-- Sentinel HQ · esquema Supabase (Postgres)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run

-- Estado completo del HQ por usuario (JSON)
create table if not exists public.hq_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.hq_state enable row level security;

drop policy if exists "hq_state_select_own" on public.hq_state;
drop policy if exists "hq_state_insert_own" on public.hq_state;
drop policy if exists "hq_state_update_own" on public.hq_state;
drop policy if exists "hq_state_delete_own" on public.hq_state;

create policy "hq_state_select_own"
  on public.hq_state for select
  using (auth.uid() = user_id);

create policy "hq_state_insert_own"
  on public.hq_state for insert
  with check (auth.uid() = user_id);

create policy "hq_state_update_own"
  on public.hq_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "hq_state_delete_own"
  on public.hq_state for delete
  using (auth.uid() = user_id);

-- Actualiza updated_at en cada escritura
create or replace function public.set_hq_state_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists hq_state_updated_at on public.hq_state;
create trigger hq_state_updated_at
  before update on public.hq_state
  for each row execute function public.set_hq_state_updated_at();
