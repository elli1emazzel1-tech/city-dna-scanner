-- ===========================================================================
-- CityScan public publication (public-first browsing, explicit opt-in)
--
-- MANUAL MIGRATION — apply by hand in the Supabase dashboard:
--   SQL Editor -> New query -> paste this file -> Run.
-- This file is intentionally NOT applied automatically.
--
-- Why this design
-- ---------------
-- "Accepted" is a pipeline outcome (quorum met), NOT a publication decision.
-- An organisation's accepted scans stay PRIVATE unless someone in that
-- organisation explicitly publishes them. This migration therefore adds:
--
--   1. public.cityscan_publications — a per-observation PUBLICATION
--      ALLOWLIST (one row = one explicitly published observation). The
--      table is created EMPTY, so every existing organisation record is
--      private by default; there is deliberately no backfill.
--   2. Two READ-ONLY public views whose row membership requires
--      publication:
--        - cityscan_public_observations: published AND status='accepted';
--        - cityscan_public_findings: published AND accepted BEFORE and
--          AFTER observations that both belong to the SAME organisation
--          as the finding (prevents cross-org evidence composition),
--          with an explicit column allowlist.
--
-- Never exposed, in any case
-- --------------------------
-- * org_id, created_by, published_by (no organisation/user identifiers);
-- * band_assets / window_pixels (internal STAC + raster metadata);
-- * rejection_reason and any non-accepted scan attempt (belt-and-braces:
--   the views require status='accepted' even if such a row were published);
-- * cityscan_reports — organisation-private by design; NO public view.
--
-- Interaction with existing RLS (all base tables unchanged)
-- --------------------------------------------------------
-- * Existing member-read / contributor-write policies on cityscan_* are
--   untouched: org members keep full access to their own rows, published
--   or not (authenticated organisation access is preserved).
-- * The views use security_invoker = false (PostgreSQL default, stated
--   explicitly). They execute as their owner, which must be the TABLE
--   OWNER (postgres — the default when running this file in the Supabase
--   SQL editor). The owner is exempt from base-table RLS, so public row
--   membership is enforced solely by each view's WHERE clause (publication
--   join + accepted + same-org) and its column allowlist.
-- * DO NOT enable FORCE ROW LEVEL SECURITY on the base tables: that would
--   apply RLS to the owner too, emptying these views and breaking every
--   access path that goes through them.
-- * cityscan_publications itself has RLS enabled with NO anonymous read
--   policy: anon querying the table directly sees zero rows; publication
--   state is visible only through the views, or to members of that org.
-- * Grants: anon and authenticated are granted SELECT on the views only
--   (ALL privileges revoked first, so no inherited write privilege can
--   ever target a view). Both views join multiple relations and are not
--   auto-updatable regardless.
-- * POST /api/cityscan/scan, /api/cityscan/cron and every write path stay
--   authenticated / secret-guarded; anon gains no write access. Service
--   role (cron) bypasses RLS as before.
--
-- Publication lifecycle (org contributors, enforced by RLS):
--   publish:   insert into public.cityscan_publications (observation_id, published_by)
--              values ('<observation uuid>', auth.uid());
--   unpublish: delete from public.cityscan_publications
--              where observation_id = '<observation uuid>';
--   A finding becomes publicly visible only once BOTH of its observations
--   are published by the same organisation.
--
-- Idempotent: safe to run more than once. Additive: no existing table,
-- column, policy or grant is altered or dropped.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Publication allowlist. Empty on creation => everything defaults to
--    private. Cascade delete removes a publication when its observation
--    row is removed.
-- ---------------------------------------------------------------------------
create table if not exists public.cityscan_publications (
  observation_id uuid primary key references public.cityscan_observations (id) on delete cascade,
  published_by   uuid not null references auth.users (id) on delete cascade,
  published_at   timestamptz not null default now()
);

comment on table public.cityscan_publications is
  'Explicit public-publication allowlist for CityScan observations. A row marks one observation as published. The public views expose only observations that have a publication row (and accepted status); findings additionally require BOTH of their observations to be published by the same organisation.';

-- ---------------------------------------------------------------------------
-- 2. Row Level Security on the allowlist itself, mirroring the existing
--    cityscan_* policy style:
--      - members of the observation's org may see its publication rows;
--      - owner/admin/analyst of the observation's org may publish or
--        unpublish, and published_by cannot be spoofed in session writes
--        (audit column is pinned to auth.uid() in WITH CHECK).
--      - INSERT/UPDATE additionally require the referenced observation to
--        already have status = 'accepted' (enforced in WITH CHECK).
--        DELETE (unpublish) is intentionally allowed regardless of status,
--        so a publication can always be retracted.
--    No public-read policy: anon sees nothing on this table directly.
-- ---------------------------------------------------------------------------
alter table public.cityscan_publications enable row level security;

drop policy if exists "cityscan_publications: member read" on public.cityscan_publications;
create policy "cityscan_publications: member read" on public.cityscan_publications
  for select using (
    exists (
      select 1 from public.cityscan_observations o
      where o.id = cityscan_publications.observation_id
        and exists (
          select 1 from public.memberships m
          where m.org_id = o.org_id
            and m.user_id = auth.uid()
        )
    )
  );

drop policy if exists "cityscan_publications: contributor write" on public.cityscan_publications;
create policy "cityscan_publications: contributor write" on public.cityscan_publications
  for all using (
    exists (
      select 1 from public.cityscan_observations o
      where o.id = cityscan_publications.observation_id
        and exists (
          select 1 from public.memberships m
          where m.org_id = o.org_id
            and m.user_id = auth.uid()
              and m.role in ('owner','admin','analyst')
        )
    )
  )
  with check (
    exists (
      select 1 from public.cityscan_observations o
      where o.id = cityscan_publications.observation_id
        and o.status = 'accepted'
        and exists (
          select 1 from public.memberships m
          where m.org_id = o.org_id
            and m.user_id = auth.uid()
              and m.role in ('owner','admin','analyst')
        )
      and cityscan_publications.published_by = auth.uid()
    )
  );

-- Explicit table privileges on the allowlist (defence in depth beyond RLS):
-- public reads go through the views, never this table, so anon is revoked
-- outright; authenticated keeps exactly the DML the RLS policies gate
-- (select / insert / update / delete = publish, view, unpublish).
revoke all on public.cityscan_publications from anon;
grant select, insert, update, delete on public.cityscan_publications to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Public view: EXPLICITLY PUBLISHED, accepted observations only.
--    Row requires: a publication allowlist row AND status = 'accepted'.
--    Column allowlist excludes org_id / created_by / band_assets /
--    window_pixels / rejection_reason / epsg.
-- ---------------------------------------------------------------------------
create or replace view public.cityscan_public_observations
with (security_invoker = false) as
select
  o.id,
  o.city_id,
  o.item_id,
  o.acquired_at,
  o.platform,
  o.tile,
  o.processing_baseline,
  o.cloud_cover_pct,
  o.valid_pixels,
  o.total_aoi_pixels,
  o.common_valid_pct,
  o.status,
  o.trigger_source,
  o.created_at
from public.cityscan_observations o
join public.cityscan_publications p
  on p.observation_id = o.id
where o.status = 'accepted';

revoke all on public.cityscan_public_observations from anon, authenticated;
grant select on public.cityscan_public_observations to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Public view: findings whose BEFORE and AFTER observations are BOTH
--    explicitly published AND accepted AND belong to the SAME organisation
--    as the finding (bo.org_id = f.org_id and ao.org_id = f.org_id). This
--    prevents a finding from ever referencing or exposing another org's
--    observation, even if that observation were published. Column
--    allowlist excludes org_id and the internal observation FK ids.
-- ---------------------------------------------------------------------------
create or replace view public.cityscan_public_findings
with (security_invoker = false) as
select
  f.id,
  f.city_id,
  f.created_at,
  f.method_version,
  f.quorum_required_pct,
  f.common_valid_pct,
  f.ndvi_mean_before,
  f.ndvi_mean_after,
  f.ndwi_mean_before,
  f.ndwi_mean_after,
  f.vegetation_area_ha_before,
  f.vegetation_area_ha_after,
  f.water_area_ha_before,
  f.water_area_ha_after,
  f.vegetation_loss_ha,
  f.vegetation_gain_ha,
  f.water_gain_ha,
  f.water_loss_ha,
  f.pixel_area_ha,
  bo.item_id               as before_item_id,
  bo.acquired_at           as before_acquired_at,
  bo.tile                  as before_tile,
  bo.cloud_cover_pct       as before_cloud_cover_pct,
  bo.processing_baseline   as before_processing_baseline,
  ao.item_id               as after_item_id,
  ao.acquired_at           as after_acquired_at,
  ao.tile                  as after_tile,
  ao.cloud_cover_pct       as after_cloud_cover_pct,
  ao.processing_baseline   as after_processing_baseline
from public.cityscan_findings f
join public.cityscan_observations bo
  on bo.id = f.before_observation_id
join public.cityscan_observations ao
  on ao.id = f.after_observation_id
join public.cityscan_publications pbo
  on pbo.observation_id = bo.id
join public.cityscan_publications pao
  on pao.observation_id = ao.id
where bo.status = 'accepted'
  and ao.status = 'accepted'
  and bo.org_id = f.org_id
  and ao.org_id = f.org_id;

revoke all on public.cityscan_public_findings from anon, authenticated;
grant select on public.cityscan_public_findings to anon, authenticated;

-- Notes
-- -----
-- * cityscan_reports has deliberately NO public view: reports are
--   organisation-private by design.
-- * Until an organisation publishes rows, the public views return zero
--   rows — anonymous visitors simply see the dashboard's empty state.
-- * POST /api/cityscan/scan and /api/cityscan/cron remain authenticated /
--   secret-guarded; nothing here grants write access to anon.
-- * Rerunning this file is safe: create table if not exists, drop policy
--   if exists, create or replace view, and revoke/grant are idempotent.
