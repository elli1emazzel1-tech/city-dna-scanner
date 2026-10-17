-- ============================================================================
-- Aurealis / DNA · City — Organisation Workspace schema + Row Level Security
-- ============================================================================
-- Run this ONCE in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- It creates the workspace tables and RLS policies that enforce organisation-level
-- data isolation. Supabase Auth manages `auth.users`; we reference it by FK.
--
-- Data model:
--   auth.users ──< memberships >── organisations ──< facilities
--                                                ──< saved_reports
--                                                ──< saved_scenarios
--
-- Isolation rule: a user can only read/write rows belonging to an organisation
-- they are a member of. Roles: owner | admin | analyst | viewer.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.organisations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 120),
  industry    text,
  region      text,
  created_by  uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table if not exists public.memberships (
  user_id     uuid not null references auth.users (id) on delete cascade,
  org_id      uuid not null references public.organisations (id) on delete cascade,
  role        text not null check (role in ('owner', 'admin', 'analyst', 'viewer')),
  created_at  timestamptz not null default now(),
  primary key (user_id, org_id)
);

create table if not exists public.facilities (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organisations (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 160),
  kind         text not null check (kind in ('Office', 'Data Centre', 'Warehouse', 'Manufacturing', 'Retail')),
  city_id      text not null,
  latitude     double precision not null check (latitude between -90 and 90),
  longitude    double precision not null check (longitude between -180 and 180),
  criticality  text not null check (criticality in ('Low', 'Medium', 'High')),
  created_by   uuid not null references auth.users (id) on delete cascade,
  created_at   timestamptz not null default now()
);

create table if not exists public.saved_reports (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organisations (id) on delete cascade,
  city_id     text not null,
  snapshot    jsonb not null,
  created_by  uuid not null references auth.users (id) on delete cascade,
  saved_at    timestamptz not null default now()
);

create table if not exists public.saved_scenarios (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organisations (id) on delete cascade,
  city_id       text not null,
  goal_id       text not null,
  assumptions   jsonb not null,
  results       jsonb not null,
  target_year   integer not null,
  model_version text not null,
  created_by    uuid not null references auth.users (id) on delete cascade,
  created_at    timestamptz not null default now()
);

create index if not exists memberships_org_idx     on public.memberships (org_id);
create index if not exists memberships_user_idx    on public.memberships (user_id);
create index if not exists facilities_org_idx      on public.facilities (org_id);
create index if not exists saved_reports_org_idx   on public.saved_reports (org_id);
create index if not exists saved_scenarios_org_idx on public.saved_scenarios (org_id);

-- ---------------------------------------------------------------------------
-- Auto-grant "owner" membership when an organisation is created.
-- SECURITY DEFINER so the membership insert is not blocked by RLS.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_organisation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.memberships (user_id, org_id, role)
  values (new.created_by, new.id, 'owner')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_organisation_created on public.organisations;
create trigger on_organisation_created
  after insert on public.organisations
  for each row execute function public.handle_new_organisation();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.organisations   enable row level security;
alter table public.memberships     enable row level security;
alter table public.facilities      enable row level security;
alter table public.saved_reports   enable row level security;
alter table public.saved_scenarios enable row level security;

-- organisations ---------------------------------------------------------------
drop policy if exists "orgs: member can read" on public.organisations;
create policy "orgs: member can read" on public.organisations
  for select using (
    exists (select 1 from public.memberships m
            where m.org_id = organisations.id and m.user_id = auth.uid())
  );

drop policy if exists "orgs: authenticated can create" on public.organisations;
create policy "orgs: authenticated can create" on public.organisations
  for insert with check (created_by = auth.uid());

drop policy if exists "orgs: admin can update" on public.organisations;
create policy "orgs: admin can update" on public.organisations
  for update using (
    exists (select 1 from public.memberships m
            where m.org_id = organisations.id and m.user_id = auth.uid()
              and m.role in ('owner', 'admin'))
  );

drop policy if exists "orgs: owner can delete" on public.organisations;
create policy "orgs: owner can delete" on public.organisations
  for delete using (
    exists (select 1 from public.memberships m
            where m.org_id = organisations.id and m.user_id = auth.uid()
              and m.role = 'owner')
  );

-- memberships -----------------------------------------------------------------
drop policy if exists "memberships: read co-members" on public.memberships;
create policy "memberships: read co-members" on public.memberships
  for select using (
    exists (select 1 from public.memberships me
            where me.org_id = memberships.org_id and me.user_id = auth.uid())
  );

drop policy if exists "memberships: admin can insert" on public.memberships;
create policy "memberships: admin can insert" on public.memberships
  for insert with check (
    (user_id = auth.uid() and role = 'owner')
    or exists (select 1 from public.memberships m
               where m.org_id = memberships.org_id and m.user_id = auth.uid()
                 and m.role in ('owner', 'admin'))
  );

drop policy if exists "memberships: admin can update" on public.memberships;
create policy "memberships: admin can update" on public.memberships
  for update using (
    exists (select 1 from public.memberships m
            where m.org_id = memberships.org_id and m.user_id = auth.uid()
              and m.role in ('owner', 'admin'))
  );

drop policy if exists "memberships: admin can delete" on public.memberships;
create policy "memberships: admin can delete" on public.memberships
  for delete using (
    exists (select 1 from public.memberships m
            where m.org_id = memberships.org_id and m.user_id = auth.uid()
              and m.role in ('owner', 'admin'))
  );

-- facilities ------------------------------------------------------------------
drop policy if exists "facilities: member read" on public.facilities;
create policy "facilities: member read" on public.facilities
  for select using (
    exists (select 1 from public.memberships m
            where m.org_id = facilities.org_id and m.user_id = auth.uid())
  );

drop policy if exists "facilities: admin write" on public.facilities;
create policy "facilities: admin write" on public.facilities
  for all using (
    exists (select 1 from public.memberships m
            where m.org_id = facilities.org_id and m.user_id = auth.uid()
              and m.role in ('owner', 'admin'))
  ) with check (
    exists (select 1 from public.memberships m
            where m.org_id = facilities.org_id and m.user_id = auth.uid()
              and m.role in ('owner', 'admin'))
  );

-- saved_reports / saved_scenarios --------------------------------------------
drop policy if exists "reports: member read" on public.saved_reports;
create policy "reports: member read" on public.saved_reports
  for select using (
    exists (select 1 from public.memberships m
            where m.org_id = saved_reports.org_id and m.user_id = auth.uid())
  );

drop policy if exists "reports: contributor write" on public.saved_reports;
create policy "reports: contributor write" on public.saved_reports
  for all using (
    exists (select 1 from public.memberships m
            where m.org_id = saved_reports.org_id and m.user_id = auth.uid()
              and m.role in ('owner', 'admin', 'analyst'))
  ) with check (
    exists (select 1 from public.memberships m
            where m.org_id = saved_reports.org_id and m.user_id = auth.uid()
              and m.role in ('owner', 'admin', 'analyst'))
  );

drop policy if exists "scenarios: member read" on public.saved_scenarios;
create policy "scenarios: member read" on public.saved_scenarios
  for select using (
    exists (select 1 from public.memberships m
            where m.org_id = saved_scenarios.org_id and m.user_id = auth.uid())
  );

drop policy if exists "scenarios: contributor write" on public.saved_scenarios;
create policy "scenarios: contributor write" on public.saved_scenarios
  for all using (
    exists (select 1 from public.memberships m
            where m.org_id = saved_scenarios.org_id and m.user_id = auth.uid()
              and m.role in ('owner', 'admin', 'analyst'))
  ) with check (
    exists (select 1 from public.memberships m
            where m.org_id = saved_scenarios.org_id and m.user_id = auth.uid()
              and m.role in ('owner', 'admin', 'analyst'))
  );

