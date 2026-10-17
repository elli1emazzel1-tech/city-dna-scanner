# CityScan Phase 4B — API Routes, Cron & Persistence Report

**Status:** Implementation complete (data API + weekly automation; no UI page in this phase).  
**Goal:** Implement `src/app/api/cityscan/*` route handlers over the verified Phase 3 processing code and the Phase 4A tables, plus the `vercel.json` cron and `CITYSCAN_CRON_SECRET` — per `CITYSCAN_PHASE4_PLAN.md` §§3, 7, 8, 10.

## 1. What was added

### Routes (Next.js App Router, server-only, JSON)

| Route | Methods | Auth | Purpose |
|---|---|---|---|
| `/api/cityscan/scan` | POST | Session + `owner\|admin\|analyst` (viewer → 403, none → 401); **or** `x-cityscan-secret == CITYSCAN_CRON_SECRET` for non-interactive callers | Run one city's scan (auto-discovers a before/after pair, or accepts manual `beforeId`/`afterId`). Returns plan §3 status enum; HTTP 500 only for `FAILED`. |
| `/api/cityscan/cron` | POST | `x-cityscan-secret` (missing/invalid → 401 per plan §3; unconfigured env → 500) | Vercel Cron entrypoint: iterates the 5 launch cities calling the **scan logic internally** (plan §7 — no HTTP hop, no session), per-city failure isolation, optional `?city=` narrowing. |
| `/api/cityscan/observations` | GET | Session (401 otherwise); optional `?orgId=` | Observation list, newest first; camelCase rows incl. `rejectionReason` (plan §3 response shape). |
| `/api/cityscan/pairs` | GET | Session; optional `?orgId=` | Accepted pairs (findings joined to before/after observations). |
| `/api/cityscan/findings` | GET | Session; optional `?orgId=` | One finding's full metrics (404 when absent). |

### Shared modules (`src/app/api/cityscan/lib/`)

| File | Role |
|---|---|
| `pipeline.ts` | The single scan implementation used by both `/scan` and `/cron`: city → AOI/UTM-zone, STAC pair discovery, `readScene`/`runScan` (Phase 3), upsert-persistence, honest `FAILED`/`NO_CLEAR` recording. Returns `CityScanResponse` (`persisted`, `metrics: null` unless quorum met, `rejectionReason` always preserved). |
| `auth.ts` | `getAuthContext`/`requireAuth` (cookie session → org membership, oldest membership first), `checkCronSecret` (401), `resolveCronActor` (optional service-role context). |
| `stac.ts` | Earth Search STAC search/fetch, city AOI (fixed ~10×10 km square), `expectedUtmEpsg` (longitude → UTM zone). |
| `types.ts` | `FindingRow`, `ScanMetrics`, full `ScanResult` shapes. |

### Infrastructure

- **`vercel.json`** (new): `"crons": [{ "path": "/api/cityscan/cron", "schedule": "0 6 * * 0" }]` — Sunday 06:00 UTC (plan §7). Routes export `maxDuration = 300`.
- **`package.json`**: added `geotiff@^2.0.1`, `proj4@^2.9.3` (plan §10.2).
- **`eslint.config.mjs`**: `src/lib/cityscan/**` in `globalIgnores` (Node-only CJS tooling, plan §10.1).
- **`.env.example`**: `CITYSCAN_CRON_SECRET`, optional `CITYSCAN_CLOUD_GATE_PCT` (plan §8) **plus** the Phase 4B cron-persistence pair below.

## 2. Key design decisions (with rationale)

1. **Cron persistence via optional service-role actor (user-approved Option 1).** Vercel cron has no session, and RLS blocks anon-key writes. When **both** `SUPABASE_SERVICE_ROLE_KEY` and `CITYSCAN_CRON_ORG_ID` (server-only) are set, cron writes through an admin client (bypasses RLS), attributing `created_by` to the org's **earliest owner/admin membership** (`memberships.created_at` asc — deterministic). When unset, cron still computes per-city summaries but stores nothing (`persisted: false` + explanatory `persistenceNote`). Matches the plan's security table ("Supabase service_role … never exposed to the client").
2. **`scan.cjs` parameterized, defaults = Phase 3 behavior.** The Phase 3 runner hardcoded `MGRS-31UFT` / `EPSG:32631` / the Amsterdam AOI — only Amsterdam could ever scan. `readScene(id, { aoi, expectedTile, expectedEpsg })` and `readGrid(url, aoi, expectedEpsg)` now take optional options **defaulting to the original constants**, and `buildPixelArrays` inverse-projects through the grid's own CRS. Omitted options → identical behavior (**proven by the Amsterdam reproduction below**).
3. **Per-city CRS via UTM zone** (`expectedUtmEpsg`): London→32630, Paris/Amsterdam→32631, Berlin→32633, Tokyo→32654. Pair discipline retained: discovered pairs pin the prior scene to the after scene's tile; `runScan` still rejects cross-tile/cross-CRS pairs.
4. **Migration amended before application** (Phase 4A file not yet run against the live DB): seven `cityscan_observations` metadata columns (`acquired_at`, `platform`, `tile`, `processing_baseline`, `cloud_cover_pct`, `epsg`, `common_valid_pct`) relaxed from `NOT NULL` so `no_clear_observation` / `failed` attempts record **NULL metadata instead of fabricated values** (no-fabrication rule). `CITYSCAN_PHASE4A_REPORT.md` amended accordingly; `cityscan_findings` unchanged (it has no `created_by` column — attribution flows through observation FKs).
5. **Idempotent writes.** Observations upsert on `unique(org_id, city_id, item_id)`; findings upsert on `unique(before, after)` — Vercel cron retries refresh instead of duplicating. Attempt rows use namespaced keys `attempt-<ISO8601>` (never a fake S2 item id).
6. **Auth model.** Interactive: session + role gate (plan §3: viewer read-only). Non-interactive: cron secret required; persistence then depends on the actor env (Option 1). Membership resolution is deterministic (oldest first); optional `orgId` (body/query) lets multi-org users target the active org — non-members get 403.
7. **STAC client hardening (live-verified):** `null/<instant>` open datetime returns HTTP 400 → replaced with `../<instant>`; server `sortby` desc confirmed; cloud gate applied **client-side** so responses distinguish "no scenes in window" from "all N scenes over the gate"; `s2:processing_baseline` (live key) with `processing:baseline` fallback; platform normalised (STAC value, item-id `S2A/B/C_` fallback) against the DB check constraint.

## 3. Verification (all executed)

| Check | Result |
|---|---|
| `npx tsc --noEmit` | **PASS** (no errors) |
| `npx eslint src/app/api/cityscan/` + full `npm run lint` | **PASS** (exit 0) |
| `node src/lib/cityscan/test.cjs` | **PASS** ("Phase 3 helper tests passed.") |
| `node --check scan.cjs` + `hardened.cjs` | **PASS** |
| `createRequire` resolution from `lib/pipeline.ts` | Resolves `src\lib\cityscan\scan.cjs`; module + exports load |
| **Amsterdam reproduction (plan §11)** — `node src/lib/cityscan/scan.cjs` | **EXACT MATCH**: ACCEPTED, 343,509/364,294 = **94.29%**, NDVI **0.6059→0.5440**, NDWI −0.5632→−0.5294, veg loss **599.25 ha** / gain 116.62 ha, water gain 0.71 / loss 0.13 — parameterization changed nothing by default (≈71 s wall time) |
| Earth Search live capability probe | `sortby` ✓, `../` open interval ✓, `null/` → 400 (bug found & fixed), sample item: `sentinel-2c`, `s2:processing_baseline: 05.12`, `MGRS-31UFT`, `proj:epsg 32631`, `boa_offset true` |
| `git status` | Only intended Phase 4 files changed/added (earlier-phase modifications pre-date this work) |

Runtime validation against the **live Supabase DB** (401/403 matrix, RLS, real inserts) requires the migration to be applied first — see §5.

## 4. Honest-outcomes matrix (no fabrication)

| Condition | status | Row(s) written | `metrics` |
|---|---|---|---|
| Quorum ≥70% | `ACCEPTED` | 2× `accepted` + 1× finding | full |
| Quorum <70% | `REJECTED_INSUFFICIENT_COMMON_VALID_PIXELS` | 2× `rejected_quorum` with reason | `null` |
| No scenes / all cloudy / no prior same-tile scene | `NO_CLEAR_OBSERVATION` | `no_clear_observation` (attempt row with NULL metadata, or the real after-item row) | `null` |
| STAC/COG/CRS/tile failure | `FAILED` (HTTP 500 on `/scan`) | `failed` with real metadata when known, else attempt row; reason = error message | `null` |
| Cron time budget exhausted | `SKIPPED_TIME_BUDGET` | none (reported in summary) | — |

## 5. Next steps

1. **Apply `supabase/migrations/cityscan.sql`** (amended — use the current file) in Supabase SQL Editor; verify tables + six RLS policies.
2. **Set env vars:** `CITYSCAN_CRON_SECRET` (required for cron); `SUPABASE_SERVICE_ROLE_KEY` + `CITYSCAN_CRON_ORG_ID` (optional, enables cron persistence); optional `CITYSCAN_CLOUD_GATE_PCT`.
3. **Runtime smoke test:** POST `/api/cityscan/scan` with a session (expect 401 anonymous, 403 viewer, 200/500 payloads), then verify rows + RLS.
4. **Cron coverage:** measured ≈71 s/city ⇒ 5 cities ≈ 355 s > 300 s Hobby limit; the single `0 6 * * 0` entry will typically process ~4 cities and honestly skip the rest (`SKIPPED_TIME_BUDGET`). For guaranteed weekly coverage, split `vercel.json` into 5 staggered single-city entries using the supported `?city=<id>` path (architecture-approved alternative).
5. `/cityscan` page (map overlays, evidence cards, reports) remains future work; it must carry "Contains modified Copernicus Sentinel data [year]" attribution (plan §6).

---

*Findings remain threshold-derived pixel counts (`method_version = 'cityscan-p3'`, no LLM) and must be field-validated before dashboard surfacing.*

---

## Appendix A — CityScanPage.tsx UI Reconstruction

**Completed:** `src/components/cityscan/CityScanPage.tsx` was severely malformed (split functions, nested hooks, detached `EvidencePanel` body, orphaned fragments) and was reconstructed piece-by-piece.

### Changes
- Reconstructed `dayOfYear` before `CityScanPage`; restored `useState`/`useCallback`/`useEffect` hooks.
- Inserted missing `EvidenceEpochGrid` between `EvidenceEpoch` and `MetricCell`.
- Added missing `EvidencePanel` function declaration wrapper; fixed its return (`</div>`, `);`).
- Appended helpers at end: `seasonLabel`, `shortId`, `statusClass`, `STATUS_LABELS`, `triggerLabel`.
- Removed escaped-quote artifacts introduced during reconstruction.

### Type fixes applied
| Issue | Fix |
|-------|-----|
| `import { cities, type City } from '@/lib/data/cities'` — `City` not exported from `cities.ts` | Split into `import { cities } from '@/lib/data/cities'` + `import type { City } from '@/lib/data/types'` |
| `HistoryPanel` `selected` prop typed `FindingSummary \| null` but call site passes `{ id: string } \| null` | Narrowed prop to `{ id: string } \| null` |
| `FindingSummary` used nonexistent fields (`status`, `pairId`, `beforeName`, `afterName`, `latestAcceptedAt`) | Replaced with real fields (`id`, `beforeId`, `afterId`, `afterAcquiredAt`) |

### Build verification
- `npx next build` — **PASS** (compiled successfully, zero errors)
- `npx tsc --noEmit` — **PASS** (zero errors across the project)

## Appendix B — observations/route.ts Type Fix

**Completed:** `src/app/api/cityscan/observations/route.ts` had an `ObservationRow` interface missing two columns that are selected and mapped.

- Added `trigger_source: string | null`
- Added `band_assets: Record<string, string> | null`

This resolved the `TS2339` errors that were blocking `next build`.

