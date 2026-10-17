-- ============================================================================
-- Aurealis / DNA · City — CityScan database foundation (Phase 4A)
-- Additive migration: creates cityscan_observations, cityscan_findings,
-- cityscan_reports with organisation-scoped Row Level Security.
--
-- Run this ONCE in the Supabase dashboard:
--   SQL Editor → New query → paste → Run.
--
-- Data model (additive, does not touch existing tables):
--   auth.users ──< memberships >── organisations ──< cityscan_observations
--                                                    ──< cityscan_findings
--                                                    ──< cityscan_reports
--
-- cityscan_observations holds one row per STAC item processed, including
-- rejected scans (status = 'rejected_quorum' / 'no_clear_observation' /
-- 'failed') together with their rejection reasons. Scan attempts that never
-- identified a STAC item (no clear scene, STAC/COG failure) are also recorded
-- with status 'no_clear_observation' / 'failed' and NULL observation metadata
-- (Phase 4B amendment, applied before this migration runs).
--
-- cityscan_findings holds verified change metrics ONLY for pairs whose both
-- observations passed the 70% common-valid quorum (status = 'accepted').
-- Rejected observations are never promoted to findings; the scan route only
-- inserts a findings row when quorum is met.
--
-- Isolation rule: a user can only read/write rows belonging to an
-- organisation they are a member of. Roles: owner | admin | analyst | viewer.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- cityscan_observations
--   One row per STAC item processed (accepted or rejected).
--   Rejected scans are preserved here with their rejection reasons; no
--   change metrics are published for them.
-- ---------------------------------------------------------------------------
create table if not exists public.cityscan_observations (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references public.organisations (id) on delete cascade,
  city_id           text not null,
  item_id           text not null,
  -- Observation metadata is nullable (Phase 4B amendment): rows with status
  -- 'no_clear_observation' / 'failed' may record a scan attempt that never
  -- identified a STAC item — their acquisition metadata is unknown and is
  -- stored as NULL rather than fabricated. Item-backed rows always populate
  -- these columns with real STAC values.
  acquired_at       timestamptz,
  platform          text check (platform in ('sentinel-2a','sentinel-2b','sentinel-2c')),
  tile              text,
  processing_baseline text,
  cloud_cover_pct   double precision check (cloud_cover_pct between 0 and 100),
  epsg              integer,
  band_assets       jsonb not null,             -- {} when no item was identified
  window_pixels     jsonb not null,             -- {} when no raster window was read
  valid_pixels      integer,
  total_aoi_pixels  integer not null check (total_aoi_pixels >= 0),  -- 0 = nothing processed
  common_valid_pct  double precision check (common_valid_pct between 0 and 100),  -- NULL = not computed
  status            text not null check (status in ('accepted','rejected_quorum','no_clear_observation','failed')),
  rejection_reason  text,
  created_by        uuid not null references auth.users (id) on delete cascade,
  created_at        timestamptz not null default now(),
  unique (org_id, city_id, item_id)
);

-- CityScan schema versioning --
-- trigger_source: 'manual' (UI scan) or 'cron' (service-role scheduled run)
alter table public.cityscan_observations
  add column if not exists trigger_source text not null default 'manual'
  check (trigger_source in ('manual', 'cron'));

-- ---------------------------------------------------------------------------
-- cityscan_findings
--   One row per accepted pair (change metrics).
--   Exists only when both observations passed the quorum; rejected scans
--   never appear here.
-- ---------------------------------------------------------------------------
create table if not exists public.cityscan_findings (
  id                    uuid primary key default gen_random_uuid(),
  org_id                uuid not null references public.organisations (id) on delete cascade,
  city_id               text not null,
  before_observation_id uuid not null references public.cityscan_observations (id) on delete cascade,
  after_observation_id  uuid not null references public.cityscan_observations (id) on delete cascade,
  ndvi_mean_before      double precision,
  ndvi_mean_after       double precision,
  ndwi_mean_before      double precision,
  ndwi_mean_after       double precision,
  vegetation_area_ha_before double precision,
  vegetation_area_ha_after  double precision,
  water_area_ha_before      double precision,
  water_area_ha_after       double precision,
  vegetation_loss_ha        double precision,
  vegetation_gain_ha        double precision,
  water_gain_ha             double precision,
  water_loss_ha             double precision,
  pixel_area_ha             double precision not null default 0.01 check (pixel_area_ha > 0),
  method_version          text not null default 'cityscan-p3',
  quorum_required_pct     double precision not null default 70 check (quorum_required_pct between 0 and 100),
  common_valid_pct        double precision not null check (common_valid_pct between 0 and 100),
  created_at              timestamptz not null default now(),
  unique (before_observation_id, after_observation_id),
  check (before_observation_id <> after_observation_id)
);

-- ---------------------------------------------------------------------------
-- cityscan_reports
--   Generated evidence-report rows (template text + cited item ids/dates)
--   for markdown download. Org-scoped. Defer full report-builder UX to a
--   later phase.
-- ---------------------------------------------------------------------------
create table if not exists public.cityscan_reports (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organisations (id) on delete cascade,
  city_id     text not null,
  title       text not null check (char_length(title) between 1 and 200),
  content     text not null,
  item_ids    jsonb not null,
  created_by  uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists cityscan_observations_org_id_idx on public.cityscan_observations (org_id);
create index if not exists cityscan_observations_city_id_idx on public.cityscan_observations (city_id);
create index if not exists cityscan_observations_status_idx on public.cityscan_observations (status);
create index if not exists cityscan_observations_acquired_at_idx on public.cityscan_observations (acquired_at desc);
create index if not exists cityscan_observations_item_idx on public.cityscan_observations (item_id);

create index if not exists cityscan_findings_org_id_idx on public.cityscan_findings (org_id);
create index if not exists cityscan_findings_city_id_idx on public.cityscan_findings (city_id);
create index if not exists cityscan_findings_created_at_idx on public.cityscan_findings (created_at desc);

create index if not exists cityscan_reports_org_id_idx on public.cityscan_reports (org_id);
create index if not exists cityscan_reports_city_id_idx on public.cityscan_reports (city_id);
create index if not exists cityscan_reports_created_at_idx on public.cityscan_reports (created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.cityscan_observations enable row level security;
alter table public.cityscan_findings enable row level security;
alter table public.cityscan_reports enable row level security;

-- cityscan_observations ------------------------------------------------------
drop policy if exists "cityscan_observations: member read" on public.cityscan_observations;
create policy "cityscan_observations: member read" on public.cityscan_observations
  for select using (
    exists (
      select 1 from public.memberships m
      where m.org_id = cityscan_observations.org_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "cityscan_observations: contributor write" on public.cityscan_observations;
create policy "cityscan_observations: contributor write" on public.cityscan_observations
  for all using (
    exists (
      select 1 from public.memberships m
      where m.org_id = cityscan_observations.org_id
        and m.user_id = auth.uid()
          and m.role in ('owner','admin','analyst')
    )
  )
  with check (
    exists (
      select 1 from public.memberships m
      where m.org_id = cityscan_observations.org_id
        and m.user_id = auth.uid()
          and m.role in ('owner','admin','analyst')
    )
  );

-- cityscan_findings ----------------------------------------------------------
drop policy if exists "cityscan_findings: member read" on public.cityscan_findings;
create policy "cityscan_findings: member read" on public.cityscan_findings
  for select using (
    exists (
      select 1 from public.memberships m
      where m.org_id = cityscan_findings.org_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "cityscan_findings: contributor write" on public.cityscan_findings;
create policy "cityscan_findings: contributor write" on public.cityscan_findings
  for all using (
    exists (
      select 1 from public.memberships m
      where m.org_id = cityscan_findings.org_id
        and m.user_id = auth.uid()
          and m.role in ('owner','admin','analyst')
    )
  )
  with check (
    exists (
      select 1 from public.memberships m
      where m.org_id = cityscan_findings.org_id
        and m.user_id = auth.uid()
          and m.role in ('owner','admin','analyst')
    )
  );

-- cityscan_reports -----------------------------------------------------------
drop policy if exists "cityscan_reports: member read" on public.cityscan_reports;
create policy "cityscan_reports: member read" on public.cityscan_reports
  for select using (
    exists (
      select 1 from public.memberships m
      where m.org_id = cityscan_reports.org_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "cityscan_reports: contributor write" on public.cityscan_reports;
create policy "cityscan_reports: contributor write" on public.cityscan_reports
  for all using (
    exists (
      select 1 from public.memberships m
      where m.org_id = cityscan_reports.org_id
        and m.user_id = auth.uid()
          and m.role in ('owner','admin','analyst')
    )
  )
  with check (
    exists (
      select 1 from public.memberships m
      where m.org_id = cityscan_reports.org_id
        and m.user_id = auth.uid()
          and m.role in ('owner','admin','analyst')
    )
  );

-- ============================================================================
-- End of CityScan Phase 4A migration.
-- ============================================================================


