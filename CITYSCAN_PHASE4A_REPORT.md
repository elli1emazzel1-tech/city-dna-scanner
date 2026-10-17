# CityScan Phase 4A — Database Foundation Report

**Status:** Implementation complete (database foundation only). No API routes, UI, cron jobs, or AI summaries were built.  
**Goal:** Add organisation-scoped Supabase tables + Row Level Security for persisting Sentinel-2 L2A change scans (CityScan), following the existing workspace schema pattern exactly.

## 1. What was added

A single additive migration file:

`supabase/migrations/cityscan.sql`

It creates three new tables (prefixed `cityscan_` to avoid collisions) and enables organisation-scoped Row Level Security on each. **No existing table, column, or policy was modified.**

> **Phase 4B amendment (pre-application):** seven `cityscan_observations` metadata columns (`acquired_at`, `platform`, `tile`, `processing_baseline`, `cloud_cover_pct`, `epsg`, `common_valid_pct`) were relaxed from `not null` so scan attempts that never identified a STAC item (`status = 'no_clear_observation' | 'failed'`) can be recorded with NULL metadata instead of fabricated values. The migration file remains the source of truth; the table below reflects the amendment.

| Table | Purpose |
|---|---|
| `cityscan_observations` | One row per STAC item processed — accepted **or** rejected. Rejected scans are preserved here together with their rejection reasons. |
| `cityscan_findings` | Verified change metrics **only** for pairs whose both observations passed the 70% common-valid quorum (`status = 'accepted'`). Rejected observations never appear here. |
| `cityscan_reports` | Generated evidence-report rows (template text + cited item ids/dates) for markdown download. |

## 2. Table details

### `cityscan_observations`

| Column | Type | Constraint |
|---|---|---|
| id | uuid | PK, `gen_random_uuid()` |
| org_id | uuid | FK → `public.organisations(id)` on delete cascade |
| city_id | text | not null (references the TypeScript cities catalog id; not a DB FK) |
| item_id | text | not null (STAC item id) |
| acquired_at | timestamptz | nullable (Phase 4B: `properties.datetime` for item rows; NULL for attempt rows) |
| platform | text | nullable, check: `sentinel-2a\|2b\|2c` (NULL for attempt rows) |
| tile | text | nullable (`grid:code`, e.g. `MGRS-31UFT`; NULL for attempt rows) |
| processing_baseline | text | nullable (e.g. `05.12`; NULL for attempt rows) |
| cloud_cover_pct | double precision | nullable, check `between 0 and 100` (NULL for attempt rows) |
| epsg | integer | nullable (city UTM zone from STAC `proj:epsg`; NULL for attempt rows) |
| band_assets | jsonb | not null (STAC asset hrefs) |
| window_pixels | jsonb | not null (width/height/origin/res) |
| valid_pixels | integer | nullable (pixels valid in both observations) |
| total_aoi_pixels | integer | not null, check `>= 0` |
| common_valid_pct | double precision | nullable, check `between 0 and 100` (NULL = not computed) |
| status | text | not null, check: `accepted\|rejected_quorum\|no_clear_observation\|failed` |
| rejection_reason | text | nullable — rejection reasons are **preserved** here |
| created_by | uuid | FK → `auth.users(id)` on delete cascade |
| created_at | timestamptz | not null, default `now()` |

Additional: `unique (org_id, city_id, item_id)` prevents duplicate rows and serves as the scan route's upsert target for idempotent re-runs (Vercel cron retries).

### `cityscan_findings`

| Column | Type | Constraint |
|---|---|---|
| id | uuid | PK, `gen_random_uuid()` |
| org_id | uuid | FK → `public.organisations(id)` on delete cascade |
| city_id | text | not null |
| before_observation_id | uuid | FK → `cityscan_observations(id)` on delete cascade |
| after_observation_id | uuid | FK → `cityscan_observations(id)` on delete cascade |
| ndvi_mean_before/after | double precision | |
| ndwi_mean_before/after | double precision | |
| vegetation_area_ha_before/after | double precision | |
| water_area_ha_before/after | double precision | |
| vegetation_loss_ha / vegetation_gain_ha | double precision | |
| water_gain_ha / water_loss_ha | double precision | |
| pixel_area_ha | double precision | not null, default `0.01`, check `> 0` |
| method_version | text | not null, default `cityscan-p3` |
| quorum_required_pct | double precision | not null, default `70`, check `between 0 and 100` |
| common_valid_pct | double precision | not null, check `between 0 and 100` |
| created_at | timestamptz | not null, default `now()` |

Additional: `unique (before_observation_id, after_observation_id)` prevents duplicate pairs; `check (before_observation_id <> after_observation_id)` prevents self-pairs.

**Rejected-scan guarantee:** `cityscan_findings` has no column for rejection reasons and no status column — it only stores verified metrics. The scan route inserts a findings row **only** when quorum is met. Rejected scans live exclusively in `cityscan_observations` with their `rejection_reason`, and are never promoted to findings.

### `cityscan_reports`

| Column | Type | Constraint |
|---|---|---|
| id | uuid | PK, `gen_random_uuid()` |
| org_id | uuid | FK → `public.organisations(id)` on delete cascade |
| city_id | text | not null |
| title | text | not null, check length `1-200` |
| content | text | not null (markdown) |
| item_ids | jsonb | not null (cited STAC item ids) |
| created_by | uuid | FK → `auth.users(id)` on delete cascade |
| created_at | timestamptz | not null, default `now()` |

## 3. Indexes

| Table | Indexes |
|---|---|
| `cityscan_observations` | `org_id`, `city_id`, `status`, `acquired_at desc`, `item_id` |
| `cityscan_findings` | `org_id`, `city_id`, `created_at desc` |
| `cityscan_reports` | `org_id`, `city_id`, `created_at desc` |

## 4. Row Level Security (org-scoped, via existing memberships)

RLS is enabled on all three tables. Policies follow the exact pattern already used for `facilities`, `saved_reports`, and `saved_scenarios` in `supabase/schema.sql`:

| Policy | Effect |
|---|---|
| `<table>: member read` | `for select` — any membership in the org can read |
| `<table>: contributor write` | `for all` (`using` + `with check`) — `owner\|admin\|analyst` can insert/update/delete |

Each policy uses the same subquery shape as the existing schema:

```sql
exists (
  select 1 from public.memberships m
  where m.org_id = <table>.org_id
    and m.user_id = auth.uid()
    [and m.role in ('owner','admin','analyst')]
)
```

Policies use `drop policy if exists` + `create policy`, so the migration is idempotent and safe to re-run.

## 5. How to apply in Supabase

1. Open your Supabase project dashboard.
2. Go to **SQL Editor → New query**.
3. Paste the entire contents of `supabase/migrations/cityscan.sql`.
4. Click **Run**.
5. Verify the three tables appear in the **Table Editor** under `public`:
   - `cityscan_observations`
   - `cityscan_findings`
   - `cityscan_reports`
6. Verify RLS is enabled and policies exist under **Authentication → Policies** (or via SQL: `select * from pg_policies where schemaname = 'public' and tablename like 'cityscan%'`).

The migration is idempotent (`create table if not exists`, `create extension if not exists`, `drop policy if exists` + `create policy`), so re-running it is safe.

## 6. Validation performed (no database access)

Because no live Supabase database is available in this environment, validation was static/review-based:

- **Additivity confirmed:** every table uses `create table if not exists` for a new `cityscan_*` name; no `alter table`, `drop table`, or column changes to existing tables.
- **FK targets confirmed:** `public.organisations`, `public.memberships`, and `auth.users` all exist in the inspected `supabase/schema.sql`; `pgcrypto` is already created there (re-declared idempotently).
- **Style conformance confirmed:** `gen_random_uuid()` PKs, `on delete cascade` FKs, `double precision` decimals, `jsonb`, `timestamptz default now()`, `text check (...)`, and the `drop policy if exists` / `create policy ... using (...) with check (...)` pattern all match `supabase/schema.sql`.
- **Constraint review:** status check values, range checks (`between 0 and 100`, `>= 0`, `> 0`), unique constraints, and the self-pair check are all present.
- **RLS review:** `alter table ... enable row level security` on all three tables; six policies (member read + contributor write per table) mirroring the existing schema.

## 7. What is intentionally NOT in Phase 4A

- API routes (`/api/cityscan/scan`, etc.)
- UI pages or components (`/cityscan`, map overlays, evidence cards)
- Cron jobs / Vercel scheduler
- AI/LLM summaries or labelled change classification
- Mock findings, fabricated dates, or hard-coded observation data
- Changes to existing tables, policies, pages, or components

## 8. Next step (Phase 4B+, not started)

Implement the `src/app/api/cityscan/*` route handlers that call the verified Phase 3 processing code (`src/lib/cityscan/scan.cjs`) and write to these tables, plus the `vercel.json` cron entry and `CITYSCAN_CRON_SECRET`. See `CITYSCAN_PHASE4_PLAN.md` sections 3, 7, 8, and 10.

---

*Prepared for CityScan Phase 4A. All metrics remain threshold-derived pixel counts (no LLM) and must be field-validated before dashboard surfacing.*


