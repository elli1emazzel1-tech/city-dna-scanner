# CityScan Phase 4 — Integration Plan (DNA·City + Next.js + Supabase)

**Status:** Plan only. No implementation, no mock findings, no fabricated data, no dashboard page, no scheduler UI, no AI summaries.  
**Goal:** Integrate the verified Phase 3 processing code (now at `src/lib/cityscan/`) into the DNA·City Next.js app so authenticated organisations can trigger Sentinel-2 L2A change scans, persist observations/findings to Supabase under Row Level Security, and serve results read-only to a future `/cityscan` page.

## 1. Source of truth (do not re-implement)

The verified Phase 3 code was moved byte-for-byte into the project and its behavior preserved (validated with `node --check` and the `assert` test suite):

| File | Location | Role |
|---|---|---|
| `hardened.cjs` | `src/lib/cityscan/hardened.cjs` | Constants (`METHOD`), reflectance scaling (`/10000`), NDVI/NDWI, SCL masks, quorum (70%), common-valid-only aggregation, grid verification (CRS/10m-20m/origin), `haFromPx`. |
| `scan.cjs` | `src/lib/cityscan/scan.cjs` | Live runner: STAC item fetch (30 s timeout), COG range-read (90 s timeout), EPSG:32631 CRS check, AOI window bounds check, tile/CRS/cross-date alignment verification, `runScan()` returning `ACCEPTED` or `REJECTED_INSUFFICIENT_COMMON_VALID_PIXELS` with metrics only when quorum is met. |
| `test.cjs` | `src/lib/cityscan/test.cjs` | Dependency-free `node:assert/strict` tests (index math, SCL masks, grid validation, quorum boundaries, common-valid-only change). Passes: `Phase 3 helper tests passed.` |

Behavior is preserved exactly: `reflectance = DN / 10000` (no extra offset), NDVI = (NIR−RED)/(NIR+RED), NDWI(McFeeters) = (GREEN−NIR)/(GREEN+NIR), SCL classes {0,1,3,8,9,10,11} excluded, class 6 water handled separately, change counted only over pixels valid in **both** observations, 70% common-valid quorum enforced, hectares = pixels × 0.01.

**Verified Phase 3 result (Amsterdam, MGRS-31UFT, no fabrication):**  
Pair `S2C_31UFT_20250819_0_L2A` → `S2C_31UFT_20260814_0_L2A`, common-valid 343,509 / 364,294 AOI pixels = 94.29% (≥70% quorum, ACCEPTED). NDVI 0.6059→0.5440, NDWI −0.5632→−0.5294, vegetation loss 599.25 ha / gain 116.62 ha, water gain 0.71 ha / loss 0.13 ha. This is the only confirmed quorum-meeting pair; it is referenced in the plan but **not** hard-coded into any route.

## 2. Integration touchpoints (read-only inspection complete)

| Existing element | Path | Relevance to Phase 4 |
|---|---|---|
| Next.js App Router | `next.config.ts`, `src/app/` | Route handlers live at `src/app/api/<name>/route.ts` (ESM). |
| API pattern | `src/app/api/openweather/air-quality/route.ts` | POST route: validate body, read env key, `AbortSignal.timeout`, return JSON, guard missing config with 503. Follow this pattern for CityScan routes. |
| Supabase server client | `src/lib/supabase/server.ts` | `createClient()` builds a `createServerClient` from cookies (anon key); RLS governs row visibility. Reuse for all CityScan routes. |
| Supabase config | `src/lib/supabase/config.ts` | `getSupabaseUrl()`, `getSupabaseKey()`. Add CityScan-specific env reads here if needed. |
| Auth / RLS schema | `supabase/schema.sql` | Tables are org-scoped (`organisations` → `memberships` → `facilities/reports/scenarios`) with roles owner/admin/analyst/viewer. CityScan tables must follow the same org-scoped RLS pattern. |
| Cities catalog | `src/lib/data/cities.ts` | `amsterdam` id = `amsterdam`, coords {52.3676, 4.9041}. Reuse catalog `id` as `city_id`; do not duplicate city definitions. |
| Types | `src/lib/data/types.ts` | `DataStatus`, `EnvironmentalMetric`, `City`, `Coordinates`. Reuse for any CityScan metric shapes returned to the UI. |
| Env | `.env.example` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `OPENWEATHER_API_KEY`. Add `CITYSCAN_CRON_SECRET` (server-only). |

## 3. Required API routes (Next.js App Router route handlers)

All routes are server-only, auth-gated via `src/lib/supabase/server.ts`, and return JSON. No HTML/dashboard pages in Phase 4.

### `POST /api/cityscan/scan`
Manual / cron-triggered scan for one city.
- **Auth:** Requires signed-in user (server client session). Role check: `owner|admin|analyst` may trigger; `viewer` may read only.
- **Body:** `{ cityId: string }` OR `{ beforeItemId, afterItemId }`. When only `cityId` is given, the route performs STAC discovery for an anniversary pair (same MGRS tile, cloud < 20 %, previous-year window) — no fabrication; if no acceptable pair exists, returns `NO_CLEAR_OBSERVATION` with no metrics.
- **Processing:** Calls `scan.cjs` `runScan()`. Enforces 70% quorum internally. On `REJECTED_INSUFFICIENT_COMMON_VALID_PIXELS`, stores a rejected observation row with `status = 'rejected'` and **no** change metrics; returns explicit status, never zeros.
- **Response:** `{ status: 'ACCEPTED'|'REJECTED_INSUFFICIENT_COMMON_VALID_PIXELS'|'NO_CLEAR_OBSERVATION'|'FAILED', observationId, cityId, itemIds, dates, commonValidPct, metrics (null when not accepted), rejectionReason }`.
- **Secret guard:** A manual trigger must also pass `x-cityscan-secret` header == `CITYSCAN_CRON_SECRET` when invoked non-interactively (protects the endpoint from unauthenticated POSTs).

### `GET /api/cityscan/observations?cityId=<id>&limit=<n>`
List observations for a city (newest first). Org-scoped via RLS.
- **Response:** array of `{ id, itemId, acquiredAt, platform, tile, processingBaseline, cloudCoverPct, status, validPixels, totalAoiPixels, commonValidPct, createdAt }`.

### `GET /api/cityscan/pairs?cityId=<id>`
List accepted pairs for the pair selector (dates, tile, cloud share, baseline). Read-only.
- **Response:** array of `{ id, beforeId, afterId, beforeAcquiredAt, afterAcquiredAt, tile, cloudCoverPctBefore/After, baselineBefore/After, ndviMeanBefore/After, vegetationLossHa, ... }` — only rows where a finding exists.

### `GET /api/cityscan/findings?cityId=<id>&pairId=<id>`
Read a single finding's metrics (read-only, org-scoped).

### `POST /api/cityscan/cron` (Vercel cron target)
Secret-guarded cron entrypoint. Iterates the launch cities; per-city failure isolation (one city's error does not abort another). Calls `POST /api/cityscan/scan` logic internally. Returns per-city summary.
- **Auth:** `x-cityscan-secret` header == `CITYSCAN_CRON_SECRET`; otherwise 401.

## 4. Database tables (additive migration, `cityscan_*` prefix)

All new tables are org-scoped with RLS following the existing `memberships` pattern. Prefix `cityscan_` to avoid collisions with existing workspace tables. No existing table, column, or policy is modified — purely additive.

### `cityscan_observations`
One row per STAC item processed (accepted or rejected).

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| org_id | uuid FK organisations | org-scoped, RLS |
| city_id | text | references cities catalog id (not an FK to a new table) |
| item_id | text | STAC item id (unique per org+city+item) |
| acquired_at | timestamptz | `properties.datetime` |
| platform | text | sentinel-2a/2b/2c |
| tile | text | `grid:code` (MGRS-31UFT) |
| processing_baseline | text | e.g. `05.12` |
| cloud_cover_pct | double precision | STAC tile-wide cloud % |
| epsg | integer | 32631 |
| band_assets | jsonb | STAC asset hrefs for B04/B08/B03/B11/SCL |
| window_pixels | jsonb | width/height/origin/res |
| valid_pixels | int | pixels valid in both observations (for pairs) — nullable for single obs |
| total_aoi_pixels | int | AOI pixel count |
| common_valid_pct | double precision | common-valid share |
| status | text | 'accepted' | 'rejected_quorum' | 'no_clear_observation' | 'failed' |
| rejection_reason | text | nullable |
| created_by | uuid FK auth.users |
| created_at | timestamptz default now() |

### `cityscan_findings`
One row per accepted pair (change metrics). Exists only when quorum met.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK |
| org_id | uuid FK organisations |
| city_id | text |
| before_observation_id | uuid FK cityscan_observations |
| after_observation_id | uuid FK cityscan_observations |
| ndvi_mean_before/after | double precision |
| ndwi_mean_before/after | double precision |
| vegetation_area_ha_before/after | double precision |
| water_area_ha_before/after | double precision |
| vegetation_loss_ha / vegetation_gain_ha | double precision |
| water_gain_ha / water_loss_ha | double precision |
| pixel_area_ha | double precision (0.01) |
| method_version | text | e.g. 'cityscan-p3' |
| quorum_required_pct | double precision (70) |
| common_valid_pct | double precision |
| created_at | timestamptz default now() |

### `cityscan_reports` (optional, Phase 4 scope)
Generated evidence-report rows (template text + cited item ids/dates) for markdown download. Org-scoped. Defer full report-builder UX to Phase 4/5 per architecture.

### RLS policies (to add in migration)
- `cityscan_observations`: member read (all roles), contributor write (owner/admin/analyst) — insert only via the scan route (server-side), never directly from the browser.
- `cityscan_findings`: member read, contributor write (server-side only).
- `cityscan_reports`: member read, contributor write.

## 5. Storage needs (Supabase Storage)

- New bucket `cityscan-cutouts` for before/after/delta PNG cutouts (optional in Phase 4; the processing code itself produces no PNGs).
- Access: org-scoped signed URLs; bucket not publicly readable. Defer to Phase 4 if cutouts are needed; the `/cityscan` page can render from finding metrics without cutouts.
- No storage writes are required for the scan route to function (metrics are persisted to Postgres, not files).

## 6. Security policies

| Concern | Policy |
|---|---|
| Authentication | All CityScan routes use `createClient()` from `src/lib/supabase/server.ts`; unauthenticated requests get 401. |
| Authorization | Role-based: `owner|admin|analyst` can trigger scans/read; `viewer` read-only. Enforced server-side; RLS is the backstop. |
| Data isolation | Every `cityscan_*` row carries `org_id`; RLS restricts to the user's memberships (same pattern as `facilities`/`saved_reports`). |
| Cron protection | `POST /api/cityscan/cron` requires `x-cityscan-secret == CITYSCAN_CRON_SECRET` (server-only env var, never in `NEXT_PUBLIC_*`). |
| No secrets in browser | `CITYSCAN_CRON_SECRET` and Supabase service_role are never exposed to the client. Only `NEXT_PUBLIC_SUPABASE_URL`/`PUBLISHABLE_KEY` (anon key) are public; RLS enforces access. |
| No fabrication | Routes return `NO_CLEAR_OBSERVATION` / `REJECTED_*` with `metrics: null` when imagery or quorum is insufficient. Never synthesize observations, dates, or change values. |
| Copernicus attribution | Any persisted finding / future UI rendering must carry `"Contains modified Copernicus Sentinel data [year]"` beside Sentinel-2 imagery (per ESA/Copernicus terms, noted in Phase 2/3 reports). |

## 7. Scheduling approach

- **Vercel Cron** (`vercel.json`): `0 6 * * 0` (Sunday 06:00 UTC), matching the architecture decision (Hobby tier, `maxDuration` 300 s). Verified Phase 3 wall time ≈ 58.7 s per pair, so one city fits comfortably; multiple cities are sequential within the cron invocation with per-city try/catch isolation.
- **Cron target:** `POST /api/cityscan/cron` with `CITYSCAN_CRON_SECRET`.
- **No `pg_cron`**, no Supabase scheduler, no in-process `setInterval`, no AI-based triggering.
- **Failure isolation:** one city's STAC/COG failure is caught and logged; other cities still process; failed city recorded with `status = 'failed'` and no metrics.

## 8. Environment variables (add to `.env.example`, server-only unless noted)

| Variable | Visibility | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | existing |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public | existing |
| `CITYSCAN_CRON_SECRET` | server only | protects `/api/cityscan/cron` and manual scan trigger |
| (optional) `CITYSCAN_CLOUD_GATE_PCT` | server only | STAC cloud filter, default 20 (per architecture) |

Do not add `OPENWEATHER_API_KEY`-style provider keys unless a CityScan data source requires one; Earth Search is keyless.

## 9. What is explicitly OUT of scope for Phase 4

- `/cityscan` page, map overlays, evidence cards, pair-selector UI (Phase 4/5 per architecture; Phase 4 plan only prepares the data API).
- Dashboard integration, saved-reports/scenarios reuse, workspace providers.
- AI/LLM summaries or labelled change classification (metrics remain threshold-derived pixel counts).
- Mock findings, fabricated dates, or hard-coded observation data.
- Changes to `supabase/schema.sql` existing tables/policies; changes to existing pages/components.

## 10. Implementation order (for a future Phase 4 sprint)

1. Add `src/lib/cityscan/**` to `eslint.config.mjs` `globalIgnores` (Node-only CJS processing tooling; not part of the Next.js app) — keeps `eslint` passing after the move.  
   *Alternative during implementation: convert `hardened.cjs`/`scan.cjs` to `.ts` so they're type-checked and linted with the rest of the app (behavior preserved, surface changed).*
2. Add `geotiff@2` and `proj4` to `package.json` dependencies (scan.cjs requires them at runtime; they are currently only in the scratch `package.json`).
3. Write additive Supabase migration (`supabase/migrations/cityscan.sql`) creating `cityscan_observations`, `cityscan_findings`, `cityscan_reports` + RLS.
4. Implement `src/app/api/cityscan/scan/route.ts`, `observations/route.ts`, `pairs/route.ts`, `findings/route.ts`, `cron/route.ts`.
5. Add `vercel.json` cron entry + `CITYSCAN_CRON_SECRET`.
6. `tsc` / `eslint` / `git status` verification (only intended new files changed).

## 11. Verification criteria (Phase 4 exit conditions)

- `tsc` passes (no new type errors from CityScan files).
- `eslint` passes (cityscan directory ignored or converted to .ts).
- All CityScan routes return 401 without a session; 403 for viewer on write; correct JSON shapes with `metrics: null` when quorum/unavailable.
- A scan against the verified Amsterdam pair reproduces the Phase 3 accepted result (94.29% common-valid, NDVI 0.6059→0.5440, vegetation loss ≈599.25 ha) — confirms the moved code behaves identically inside Next.js.
- `git status` shows only intended Phase 4 additions (no unrelated project files modified).

---

*Prepared for CityScan Phase 4 planning. Findings remain threshold-derived pixel counts (no LLM) and must be field-validated before dashboard surfacing.*





