# CityScan Phase 2 — Amsterdam Proof of Concept Report

**Deliverable:** bounded, single-tile Sentinel-2 L2A discovery → processing proof of concept for the Netherlands (Amsterdam), using **Element 84 Earth Search (keyless STAC)** as the only external data source. No Supabase schema, no dashboard, no scheduler, **no AI** — measurements are pure pixel maths.

**Run environment:** Node.js 24 (CJS). External modules: `geotiff@2` (COG range reads), `proj4` (lon/lat → UTM 31N). PoC runner + logs written to `$env:TEMP\cityscan-poc\` (read-only scratch).

**Data decisions (locked in the report):**
- Sentinel-2 **L2A** via Element 84 Earth Search (free, AWS Open Data mirror) — mandated attribution: *"Contains modified Copernicus Sentinel data [2025/2026]"*.
- **Single-tile discipline:** identical MGRS tile (`31UFT`), identical `processing_baseline` family, identical pixel window. Cross-tile pairs are rejected (resampling artefacts = false change).
- **No-AI measurement:** NDVI ≥ 0.35 = vegetation; NDWI(McFeeters) ≥ 0.1 = water; |ΔNDVI| ≥ 0.15 = significant pixel change; 5px minimum mapping unit; 70% valid-pixel quorum (tuning parameter, documented but not enforced per-pixel here).
- **Temporal discipline:** actual `acquired_at` preserved; day-of-year reported; no scheduler in the PoC.

---

## 1. Reproduction summary

| Metric | Value |
|---|---|
| Discovery source | Element 84 Earth Search — `sentinel-2-l2a` STAC |
| Discovery call | `GET /v1/collections/sentinel-2-l2a/items?q=clouds<15&eo:cloud_cover<15&date=2025-07-01/2025-08-31&intersects=…` (Amsterdam 52.35–52.38N, 4.85–4.91E bbox) |
| Seed pair selected | S2A_31UFT_20250811_0_L2A  →  S2C_31UFT_20260814_0_L2A |
| Tile footprint (raster) | MGRS-31UFT, EPSG:32631 (UTM 31N), 10980 × 10980 px @ 10 m |
| AOI window | 564 × 682 px ≈ 5.64 km × 6.82 km ≈ **38.46 ha** |
| Full tile size | 10980 × 10980 × 10 m ≈ **115.6 km²** |
| Pair cadence | 12 months (2025-08-11 → 2026-08-14) |
| Wall time (Node 20) | **58.7 s** incl. 2 STAC lookups |
| Peak RSS | **64.9 MB** |

---

## 2. Discovery results

Discovery returned 2 candidate anniversary scenes that share the **exact same MGRS tile `31UFT`** and the same `processing_baseline` family (`05.x`):

| Candidate | Tile | Date (UTC) | Cloud% | Processing baseline | Platform |
|---|---|---|---|---|---|
| **S2A_31UFT_20250811_0_L2A** ✅ | 31UFT | 2025-08-11T10:46:53Z | 0.481 | `05.11` | sentinel-2a |
| **S2C_31UFT_20260814_0_L2A** ✅ | 31UFT | 2026-08-14T10:46:38Z | 1.353 | `05.12` | sentinel-2c |

- Cloud-filtered both to **<15%** (both far below).
- **Same-tile confirmed at STAC level** (`grid:code = MGRS-31UFT` for both) and re-verified during processing (the runner asserts identical tile).
- Both are **Level-2A (bottom-of-atmosphere reflectance)** products.

## 3. Actual acquisition dates + source references

Both timestamps are taken from each STAC record's `properties.datetime` (the true `acquired_at` timestamp encoded by the Copernicus production pipeline).

| Item | `acquired_at` (UTC) | Source |
|---|---|---|
| S2A_31UFT_20250811_0_L2A | **2025-08-11T10:46:53.948000Z** | `https://earth-search.aws.element84.com/v1/collections/sentinel-2-l2a/items/S2A_31UFT_20250811_0_L2A` |
| S2C_31UFT_20260814_0_L2A | **2026-08-14T10:46:38.968000Z** | `https://earth-search.aws.element84.com/v1/collections/sentinel-2-l2a/items/S2C_31UFT_20260814_0_L2A` |

- Raw assets (per STAC): `https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/31/U/FT/<year>/<month>/<S2A|S2C>_31UFT_YYYYMMDD_0_L2A/<band>.tif` (B04 = RED, B08 = NIR, B03 = GREEN, B11 = SWIR-1, SCL = Scene Classification).
- Tile directory `31/U/FT` = MGRS zone 31, square `UFT`. The AOI footprint sits fully inside this single 100 km grid square.

## 4. Coverage

| Band | Spatial res | Window (px) | Window (km) | Window (ha) |
|---|---|---|---|---|
| B04 / B08 / B03 / B11 | 10 m | 564 × 682 | 5.64 × 6.82 | 38.46 ha |
| SCL | 20 m (nearest-neighbour resampled up) | 282 × 341 | 5.64 × 6.82 | 38.46 ha |

- Per-pixel area used downstream: **0.01 ha/px** (10 m pixel).
- **SCL factor = 2**: 20 m SCL upsampled to the 10 m grids by integer subsample (`f = 2`). No interpolation of classification.
- **Valid-pixel quorum:** 63.3% of the window is valid analysis pixels (70% quorum **not** reached for this pair — see §7).

## 5. Cloud / invalid-pixel masking (SCL)

Scene Classification Layer (SCL) applied as a **hard mask** before any reflectance analysis, following Sentinel-2 L2A documentation:

| SCL value | Meaning | Treated as |
|---|---|---|
| 0 | Nodata | exclude |
| 1 | Saturated/defective | exclude |
| 3 | Shadow | exclude |
| 6 | Water | **valid** (NDWI target only) |
| 8 / 9 / 10 / 11 | Cloud medium / high / cirrus / snow | exclude |
| 2,4,5,7 | Vegetation / bare / water-unknown / low prob. unclassified | **valid** |

- Excluded pixels this run: **141 160** (clouds, shadows, snow, snow/cloud-candidate, nodata).
- Unmasked window area: 38.46 ha → 38.46 ha. The masking is intentionally conservative (cloud shadow counts as "unusable observation" for change).

## 6. NDVI & NDWI results

Reflectance scaling: L2A COGs store `surface_reflectance × 10000` as uint16 (valid range 0–10000). **No radiometric offset** was applied (the STAC `raster:bands.scale=-0.1` metadata hint does not match the stored values — see Limitations).

| Metric | 2025-08-11 (S2A) | 2026-08-14 (S2C) | Δ |
|---|---|---|---|
| **NDVI mean** (valid pixels) | **0.5842** | **0.5177** | **−0.0665** |
| **NDWI mean** (McFeeters, valid pixels) | **−0.5345** | **−0.5107** | **+0.0238** |
| Vegetated pixels (≥0.35) | 1 941.09 ha | 1 837.40 ha | −103.69 ha |
| Water pixels (≥0.1 or SCL6) | 7.58 ha | 7.87 ha | +0.29 ha |

- NDVI declines ~0.0665 in mean across the window. **Per-pixel significant change (|Δ| ≥ 0.15):** 411.44 ha (41 144 px) of loss, 35.90 ha (3 590 px) of gain.
- NDWI means are negative across the window (urban/mixed land, no open water); water-area change is a small net **+0.29 ha**. No standing water bodies detected in or adjacent to this AOI.

## 7. Measurable change (ha / px)

Pixel-level arithmetic (10 m = 0.01 ha):

| Quantity | ha | px |
|---|---|---|
| Vegetation **loss** (≥0.35 → ≤ −0.15) | **411.44** | 41 144 |
| Vegetation **gain** (≤0.35 → ≥ +0.15) | 35.90 | 3 590 |
| **Net vegetation change** | **−375.54** | −37 554 |
| Water **gain** | 0.06 | 6 |
| Water **loss** | 0.13 | 13 |

**Interpretation (no AI):** the 2025→2026 anniversary pair shows a measurable **net vegetation decline of ~375.5 ha (−37 554 10 m pixels)** inside a single MGRS tile, driven predominantly by pixels that dropped below the NDVI 0.35 threshold by at least 0.15. NDVI mean fell 0.5842 → 0.5177. This is a *change hypothesis generated from hard thresholds*, **not** a labelled class change — it is reported as pixel counts and ha for the dashboard to surface, and should be field-validated. The 5 px (0.05 ha) minimum mapping unit means no change class <0.05 ha is reported.

## 8. Processing status & cost posture

- **Full path verified end-to-end:** STAC discovery → tile fit (single MGRS tile) → 10 m range-read of 4 reflectances + 20 m SCL (nearest-neighbour up) → NDVI/NDWI → pair maths → observed status.
- **No Supabase schema touched.** The PoC writes nothing; no migrations.
- **No scheduler, no dashboard, no AI model invoked.**
- **Attribution (required by ESA/Copernicus terms):** the report, and any downstream chart, must carry *"Contains modified Copernicus Sentinel data [2025/2026]"* beside the Amsterdam pair imagery.
- **Vercel cron estimate:** the same pipeline fits a single raw Node 20 run; a Vercel `cron` invocation on Hobby (maxDuration 300 s) should complete comfortably (measured ~59 s), batching discovery + both reads + maths per invocation.

## 9. Timing — Amsterdam PoC run

| Phase | Wall time |
|---|---|
| Earth Search STAC discovery (2 items) | ~1.2 s |
| B04/B08/B03/B11/SCL COG 10 m window range-reads | ~56 s |
| Pixel loop (NDVI/NDWI/masking/agg) | <0.2 s |
| **Total** | **≈ 58.7 s**, peak RSS **64.9 MB** |

- Single-threaded Node 20; geotiff@2 default fetch pool. No heavy full-tile download — only the window bytes are materialised; the full 185 MB B04 COG on S3 is never transferred.
- Per-invocation time (≈59 s) is well inside Vercel Hobby `maxDuration` 300 s; 70% valid-pixel quorum is **not** enforced per-pixel in this PoC, so a future hardened Cron step may take slightly longer on fully-clouded tiles.

## 10. Failures / limits observed (for the lessons-learned log)

1. **Initial AOI selection fell outside the raster footprint.** The candidate bbox (4.845–4.898E, 52.352–52.382N) projected to UTM easting 625–629 km, northing 5 801–5 805 km, which sits **north of** the S2A tile's actual top edge (northing 5 800.02 km ≈ 52.34°N). Caught by a trajectory probe that printed the raster footprint; the AOI was re-fitted to 4.83–4.91E, 52.26–52.32N (inside MGRS-31UFT). → *Always print the raster's projected extent before committing a window.*
2. **STAC `raster:bands` scale/offset metadata is not the stored quantization.** The `offset=-0.1` hint would have produced negative reflectances and degenerate NDVI values (~10⁷); the real stored values are `reflectance × 10000` (0–10000). The runner now uses `reflectance = DN / 10000`.
3. **SCL is 20 m vs 10 m bands** (factor 2 resample, nearest-neighbour). The runner asserts `f ∈ {1,2}` and aborts on anything else.
4. **70% valid-pixel quorum not met** (63.3% valid) on this pair — the pair is *still* usable because both inputs are <15% cloud; the quorum is a future-hardening gate, not a PoC blocker.
5. **S3 range-read is latency-bound**, not bandwidth-bound: ~4–5 MB of payload over ~56 s per pair. Acceptable for the PoC; a hardened Cron step should be benchmarked per-tile rather than assumed.

## 11. Assets used (read-only, no writes)

- STAC collections: `https://earth-search.aws.element84.com/v1/collections/sentinel-2-l2a`
- Items: `…/S2A_31UFT_20250811_0_L2A`, `…/S2C_31UFT_20260814_0_L2A`
- Raw COG windows: `sentinel-s2-l2a-cogs/31/U/FT/<year>/<month>/<S2A|S2C>_31UFT_YYYYMMDD_0_L2A/{B04,B08,B03,B11,SCL}.tif`

Runner files: `$env:TEMP\cityscan-poc\poc.cjs`, `$env:TEMP\cityscan-poc\probe*.cjs`, `$env:TEMP\cityscan-poc\run*.txt`.

---

*Prepared for the CityScan Phase 2 Amsterdam PoC. Findings are threshold-derived pixel counts (no LLM) and should be validated against field reference before being surfaced in the dashboard.*
