# CityScan — Technical Architecture & Feasibility Audit (Phase 1)

**Status:** Audit document only. No code, no schema changes, no new routes — per task scope.
**Date:** 15 October 2026
**Context:** Enrealys (Next.js 16.3 / React 19 / Tailwind 4 / Supabase Auth + Postgres + RLS / Leaflet + react-leaflet). Existing Supabase schema (`supabase/schema.sql`) contains only workspace tables: `organisations`, `memberships`, `facilities`, `saved_reports`, `saved_scenarios` — org-scoped with RLS. Nothing is modified by this audit.

**Five launch cities (per task; subset of the existing catalog in `src/lib/data/cities.ts`):** London, Paris, Amsterdam, Berlin, Tokyo. One fixed AOI per city: a ~10 × 10 km square centred on the catalog coordinates. Small tiles keep downloads inside free quotas; boundaries can be swapped for real admin polygons when WatchZones land.

---

## 2. Data flow: acquisition → pair selection → detection → storage → display

```
 Weekly trigger (Sun 06:00 UTC — §6)
   └─▶ GET /api/cityscan/scan?city=<id>&trigger=cron  (Vercel Cron → server route)
        ├─▶ 1. STAC search (Earth Search): AOI bbox × last-14-day window,
        │      eo:cloud_cover < 20, collection sentinel-2-l2a. Take newest
        │      item passing cloud gate; else mark city NO_CLEAR_OBSERVATION.
        ├─▶ 2. Range-read COG windows (B04/B08 10 m, B03 10 m, B11,
        │      SCL 20 m→nearest) cropped to AOI via geotiff.js.
        ├─▶ 3. Per-pixel masks: SCL cloud/shadow/snow/water → valid-data mask;
        │      discard pair if either side has <70 % valid AOI pixels.
        ├─▶ 4. Band algebra (§2.2): NDVI_t0/t1, NDWI_t0/t1, Δ maps, patch stats.
        ├─▶ 5. Persist observation + measurements + findings to Supabase (§3);
        │      upload before/after + Δ PNG cutouts to Storage bucket.
        └─▶ 6. /cityscan page reads Supabase (never live-processes) and renders
               map overlays + evidence cards with acquisition dates.
```

### 2.1 Comparing two observations (pair discipline — where most projects go wrong)

- **Same tile & grid:** require identical MGRS tile ID; crop both to the identical AOI pixel window. Reject pairs from different tiles (resampling across tile boundaries introduces false change).
- **Same processing baseline family:** record `processing_baseline` (e.g. `05.10`) from L2A metadata on every observation; warn in the UI when a pair straddles a baseline change, and prefer Collection-1 (`sentinel-2-c1-l2a`) items where available for long histories, since Collection-1 reprocessing gives uniform PB 05.00/05.10 + harmonised S2A/S2B radiometry.
- **Seasonal guard:** comparisons always show day-of-year for both dates; the page labels cross-season pairs ("t0 late winter vs t1 midsummer — vegetation signal dominated by phenology") and the default view prefers anniversary pairs (same ±30-day seasonal window, previous year) for the "trend" card. Raw Δ numbers are still stored; interpretation text is conditional on the seasonal flag.
- **No-data/cloud gate:** SCL classes used — 3 cloud shadow, 8–9 cloud (med/high), 10 cirrus, 11 snow/ice are *excluded* from change maths; class 6 water is excluded from vegetation maths and analysed separately. SCL is good but imperfect (bright roofs can masquerade as cloud; thin cirrus leaks) — hence the 70 % valid-pixel quorum and per-pair cloud-share reporting.

### 2.2 Detection maths (measurable, deterministic, threshold-published)

All computed at 10 m on the valid-pixel mask; thresholds live in a versioned `METHOD` constant stored per finding (`method_version`), so results are reproducible:

- **Vegetation:** `NDVI = (B08 − B04) / (B08 + B04)`. Vegetated pixel: NDVI ≥ 0.35 (urban-tuned; dense urban vegetation 0.4–0.8, bare soil/concrete < 0.2–0.3). Change pixel: |ΔNDVI| ≥ 0.15 with sign → loss/gain masks.
- **Surface water:** `NDWI = (B03 − B08) / (B03 + B08)` (McFeeters). Water pixel: NDWI ≥ 0.1, cross-checked against SCL water class 6 (not used as ground truth). Change pixel: |ΔNDWI| ≥ 0.15 → appearance/disappearance masks.
- **Patch extraction:** 4-connectivity labelling on each change mask; discard patches < 5 px (< 500 m² at 10 m) as noise. Store centroid, pixel count, area ha, mean Δ.
- **Outputs per pair:** % and ha of vegetation loss/gain, % and ha of water appearance/disappearance, valid-pixel %, cloud-share both dates, before/after/Δ PNG cutouts (≤ 800 px), patch GeoJSON (top 20 by area).
- **Resolution honesty:** 10 m pixels cannot see street trees, green roofs, or narrow canals. The page states the minimum mapping unit (500 m²) next to every finding. Sub-pixel claims are never made.

## 3. Proposed database schema (NEW tables only — additive migration)

Naming: `cityscan_*`, all with `org_id` FK + the same RLS pattern as existing tables (member read; owner/admin/analyst write). No existing table is touched.

```sql
create table public.cityscan_areas (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organisations (id) on delete cascade,
  city_id     text not null,          -- matches src/lib/data/cities.ts ids
  label       text not null,          -- e.g. 'London — 10km core'
  bbox        jsonb not null,         -- {minLon,minLat,maxLon,maxLat} WGS84
  created_at  timestamptz not null default now(),
  unique (org_id, city_id)
);

create table public.cityscan_observations (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references public.organisations (id) on delete cascade,
  area_id             uuid not null references public.cityscan_areas (id) on delete cascade,
  acquired_at         timestamptz not null,   -- actual sensing time, shown in UI
  tile_id             text not null,          -- MGRS tile, e.g. '30UYC'
  platform            text not null default 'Sentinel-2B',
  product_id          text not null,          -- full S2 product name
  collection          text not null,          -- 'sentinel-2-l2a' | 'sentinel-2-c1-l2a'
  processing_baseline text not null,          -- e.g. '05.10'
  cloud_cover_pct     numeric not null,       -- scene-level, from STAC
  valid_pixel_pct     numeric not null,       -- AOI valid share after SCL masking
  stac_item_url       text not null,          -- source STAC item (provenance link)
  status              text not null default 'OK'
                      check (status in ('OK','CLOUDY_REJECTED','NO_CLEAR_OBSERVATION','FAILED')),
  created_at          timestamptz not null default now(),
  unique (area_id, product_id)
);

create table public.cityscan_measurements (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organisations (id) on delete cascade,
  observation_id  uuid not null references public.cityscan_observations (id) on delete cascade,
  kind            text not null check (kind in ('NDVI_MEAN','VEG_PIXELS','VEG_HA','WATER_PIXELS','WATER_HA')),
  value           numeric not null,
  unit            text not null,          -- 'ratio' | 'pixels' | 'ha'
  method_version  text not null default 'ndvi-ndwi-v1',
  created_at      timestamptz not null default now()
);

create table public.cityscan_findings (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organisations (id) on delete cascade,
  area_id        uuid not null references public.cityscan_areas (id) on delete cascade,
  before_id      uuid not null references public.cityscan_observations (id),
  after_id       uuid not null references public.cityscan_observations (id),
  veg_loss_ha    numeric not null,
  veg_gain_ha    numeric not null,
  water_gain_ha  numeric not null,
  water_loss_ha  numeric not null,
  seasonal_flag  text not null check (seasonal_flag in ('ANNIVERSARY','CROSS_SEASON','SHORT_INTERVAL')),
  same_tile      boolean not null default true,
  baseline_match boolean not null default true,  -- false → UI comparability warning
  patches        jsonb not null default '[]',    -- top patches: centroid, ha, mean delta
  overlay_before text,                           -- Storage paths, PNG cutouts
  overlay_after  text,
  overlay_delta  text,
  summary        text not null,   -- template text; every figure cites finding/measurement ids
  created_at     timestamptz not null default now()
);

create table public.cityscan_reports (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organisations (id) on delete cascade,
  area_id    uuid not null references public.cityscan_areas (id),
  title      text not null,
  body_md    text not null,   -- every figure cites finding/measurement ids + acquisition dates
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Future WatchZones (schema-ready, NOT built in Phase 1–3):
-- public.cityscan_watchzones (id, org_id, area_id nullable, name, geom jsonb
--   polygon, created_by, created_at) — findings gain a nullable watchzone_id later.
```


---

## 1. Recommended data source, APIs and processing libraries

### 1.1 Imagery source: Sentinel-2 L2A, free and commercially usable

- **Product:** Sentinel-2 Level-2A surface reflectance (atmospherically corrected; what change detection needs — L1C top-of-atmosphere is not analysis-ready).
- **Licence:** Copernicus Sentinel data are free, full and open, **including commercial use**, subject to attribution. Every CityScan surface that shows or derives from Sentinel data must carry: *"Contains modified Copernicus Sentinel data [year]"* (exact wording per Copernicus terms), plus a licence line in `/data-sources` and in each report. No licence fee, no approval needed — but the attribution string is mandatory, not optional.
- **Sensors:** S2A + S2B give a **5-day revisit** at the equator. Relevant bands: B02/B03/B04/B08 = **10 m**; B8A/B11/B12 = 20 m; coastal/aerosol/cirrus = 60 m. Swath 290 km.
- **City-scale math check:** a 10 × 10 km AOI at 10 m = 1000×1000 px per band (~2.8 MB LZW COG read per band via range request; a full 10980×10980 tile is ~600 MB–1 GB per band but we never download whole tiles).

### 1.2 Primary access path: Element 84 Earth Search (AWS Open Data, no account)

- `sentinel-cogs` S3 bucket (`us-west-2`) + Earth Search STAC API — **public, no sign-up, no AWS account required**, keyless HTTP range reads of COGs. This is the pipeline's acquisition layer: `GET /search` on `sentinel-2-l2a` (bbox + datetime + `eo:cloud_cover` filter), then byte-range reads of the asset URLs (B04, B08, B03, B11, SCL).
- **Alternative / fallback:** Microsoft Planetary Computer STAC (`sentinel-2-l2a`) — also free, but requires a (free) account key for SAS-signed asset URLs and has rate limits on the signing endpoint; SAS token expiry complicates long jobs. Use only if Earth Search is down.
- **Avoid for the pipeline:** Copernicus Data Space Ecosystem OData/S3 as the primary path — free-tier quotas (12 TB/30 d IAD transfer, 4 concurrent connections, 10-minute token lifetime, 60-minute refresh window) are workable but add credential/session machinery; openEO's 10 000 free credits/month are generous but unnecessary when we can do the maths ourselves. Revisit only if AWS egress costs bite (see §4).

- **Do NOT use** the Esri World Imagery basemap already embedded in `InteractiveCityMap` as analysis input: it is a visual mosaic under the Esri Master License Agreement (personal/non-commercial default), not a dated, calibrated observation. It may stay as a *display* basemap underneath change overlays only — with its existing attribution intact.

### 1.3 Processing: Node.js + `geotiff.js`, in the API route (no Python service)

- **Reader:** [`geotiff.js`](https://geotiffjs.github.io/) (MIT) — pure JS, works in **both Node 20+ and the browser**, supports BigTIFF, deflate/LZW, internal tiling and HTTP range requests (`makeRemoteSource`). Reads a windowed 10 m crop via the COG tile index without downloading whole files.
- **Maths:** hand-rolled band algebra on `Float32Array` (NDVI/NDWI/thresholds — §2.2). No NumPy/GDAL service to host; no new infrastructure. (`geoblaze` exists for browser-side stats, but server-side plain TypedArrays are simpler and testable.)
- **New dependencies (all free, MIT):** `geotiff` only. Optional later: `proj4` if a non-Web-Mercator reprojection is ever needed (Leaflet overlays do not need it).
- **Display:** existing stack — Leaflet `ImageOverlay` (data-URL/PNG cutouts ≤ ~1 MB) or `L.gridLayer` for tiles, plus `CircleMarker`/polygon vectors for detected patches. Overlay PNGs are generated server-side from the *actual* cropped rasters, never mockups. No TiTiler/self-hosted tile server in Phase 1 — serving pre-rendered PNG cutouts from Supabase Storage is sufficient for 5 cities × weekly.

### 1.4 What "AI findings" means here (anti-fabrication rule)

There is **no vision-LLM labelling, no chatbot classification**. A "finding" is a row of numbers computed from pixel counts (e.g. "vegetated pixels: 41 203 → 38 977 (−5.4 %), 2.23 ha, SCL-cloud share 4.1 % → 3.8 %"). Natural-language summaries in reports are templates filled from those numbers, each number citing its `measurement_id`. Anything that cannot be traced to a stored measurement is not shown.

---

## 4. Infrastructure requirements and costs (expected: 0 EUR/month at Phase 1-3 scale)

| Item | Choice | Cost |
|---|---|---|
| Imagery + catalogue | Element 84 Earth Search STAC + `sentinel-cogs` S3 (public, keyless) | 0 EUR. AWS Open Data egress is free to the internet for this bucket; if egress policy ever changes, fall back to Copernicus Data Space free tier (12 TB/30 d) |
| Compute | Vercel serverless route (`maxDuration` up to 300 s Hobby / 800 s Pro) running `geotiff.js` windowed reads. Per city: ~5 ranged COG reads at ~15-25 MB transfer, ~30-90 s wall time (mostly I/O). Sequential per-city invocations stay well under limits | 0 EUR (Hobby free tier; cron available on all plans) |
| Scheduler | Vercel Cron (`0 6 * * 0` UTC Sunday) to one fan-out route that processes cities sequentially with per-city try/catch (or 5 staggered entries to isolate failures) | 0 EUR |
| Database + Storage | Supabase (existing project): 5 small tables + ~780 PNGs/year | 0 EUR (inside free-tier DB + 1 GB storage) |
| Tile serving | Pre-rendered PNG cutouts from Storage via Leaflet `ImageOverlay`; no TiTiler/self-hosted tiler | 0 EUR |
| New dependencies | `geotiff` (MIT) only | 0 EUR, no paid service introduced |

No new paid service is introduced anywhere. If later scale (hundreds of cities, daily scans, on-demand browser processing) outgrows serverless windows, the documented escape hatches are: staggered crons, then Supabase `pg_cron` + `pg_net` fan-out (no new vendor), then a dedicated worker (cheap VPS or AWS Batch) — all flagged as approval-gated in section 7.

---

## 5. Technical limitations (must be visible in the UI, not buried)

1. **Clouds win sometimes.** London/Amsterdam in winter can go weeks without a <20 % scene; the page shows `NO_CLEAR_OBSERVATION` weeks honestly with the last good pair retained. Weekly *attempts*, not weekly *results*.
2. **10 m floor.** Street trees, green roofs, narrow canals, single-house demolitions are invisible. Minimum mapping unit 500 m2 is printed beside every finding.
3. **SCL masks are imperfect.** Bright rooftops can flag as cloud; thin cirrus leaks through; snow/ice (class 11) blanks winter scenes. Mitigated by the 70 % valid-pixel quorum and per-pair cloud-share display — not by pretending masks are perfect.
4. **Phenology is not loss.** A summer-to-autumn NDVI drop is seasonal, not deforestation. The seasonal flag + anniversary-pair default exist for exactly this; cross-season numbers are labelled, never hidden.
5. **Baseline drift.** Future PB changes can shift reflectance slightly; `baseline_match=false` triggers a comparability warning, and Collection-1 is preferred for histories.
6. **Fixed 10 km squares initially.** City-centre squares are not administrative boundaries; swap for real polygons at WatchZones (section 7, decision 4).
7. **Vercel execution ceiling.** Hobby 300 s (Pro 800 s) per invocation — fine for 5 sequential cities at ~1-2 min each; hundreds of cities need the worker escape hatch (section 4).
8. **No SAR, no night, no thermal.** Sentinel-2 is optical daytime only. Flood detection here means *standing-water extent* (NDWI), not depth, flow or pluvial risk — consistent with how the dashboard already labels GloFAS discharge.

---

## 6. /cityscan page design (reads Supabase only — never live-processes)

New route `src/app/cityscan/page.tsx` reusing `DashboardShell` + existing dark/teal styling; no existing page or component is modified:

- **City selector:** the 5 launch cities (reuse city catalog ids; a CityScan-scoped picker, not the dashboard one).
- **Pair selector:** before/after acquisition-date dropdowns (actual `acquired_at` values from `cityscan_observations`), defaulting to the latest anniversary pair; each option shows tile ID, cloud share, baseline.
- **Map panel:** existing Leaflet setup + `ImageOverlay` before/after/Delta cutouts with opacity slider, patch polygons (top 20 by area, hover = ha + mean Delta), Esri Satellite or OSM basemap underneath (display only).
- **Evidence cards:** veg loss/gain ha + %, water appearance/disappearance ha + %, valid-pixel %, cloud shares, seasonal flag, baseline-match warning, minimum-mapping-unit note, Copernicus attribution string, and a link to the source STAC item per observation.
- **History:** all past pairs for the city from `cityscan_findings`, newest first; each expandable to the same map + cards.
- **Reports:** "Generate evidence report" writes a `cityscan_reports` row (template text + cited ids/dates) and offers markdown download; full report-builder UX is a later phase.
- **Empty/failed states:** `NO_CLEAR_OBSERVATION` / `CLOUDY_REJECTED` / `FAILED` render as explicit status cards ("no clear observation this week — last good pair retained"), never as zeros or placeholders.

---

## 7. Phased implementation plan + decisions requiring your approval

- **Phase 2 — Pipeline core (server only, no UI):** `geotiff` dependency, `src/lib/cityscan/` (STAC client, COG window reader, indices, patches), `/api/cityscan/scan` route with secret-guarded manual trigger, additive Supabase migration (`cityscan_*` tables + RLS + Storage bucket). Verified with one backfilled London pair; thresholds calibrated against it.
- **Phase 3 — /cityscan page:** route + map overlays + evidence cards + history, per section 6. Read-only against Supabase.
- **Phase 4 — Weekly automation + reports:** `vercel.json` cron (`0 6 * * 0`), per-city failure isolation, report generation + markdown export, Copernicus attribution line in UI and reports.
- **Phase 5 — WatchZones (future):** user-drawn polygons (`cityscan_watchzones`), per-zone findings, admin-boundary presets, alerting.

### Decisions requiring your approval (STOP — do not proceed without explicit sign-off)

1. **Go/no-go on Phase 2** (pipeline core) as specified above.
2. **Launch cities:** confirm London, Paris, Amsterdam, Berlin, Tokyo — or substitute (any catalog city works; polar/tropical-monsoon cities change cloud expectations).
3. **NDVI 0.35 / Delta 0.15 / 500 m2 thresholds:** accept as v1 constants (stored as `method_version`), or require calibration against a reference dataset first.
4. **AOI definition:** accept fixed 10 km city-centre squares for Phase 1-4, deferring real administrative boundaries to WatchZones.
5. **Commercial posture:** confirm the product may show "Contains modified Copernicus Sentinel data" attribution and rely on the free Copernicus licence commercially (no fee, but attribution is a legal requirement).
6. **Hosting/scheduler:** confirm Vercel Cron + Hobby-tier execution is acceptable for the weekly pipeline (vs. Supabase pg_cron now, or a paid worker later).
7. **Reports scope:** template-filled evidence reports in Phase 4, or defer report-builder UX entirely.
8. **Planetary Computer fallback:** pre-approve the free-account key as a contingency acquisition path (no cost), or keep Earth Search as the sole source.

*End of Phase 1 audit. No code, schema, or route changes were made; the only new file is this document.*

