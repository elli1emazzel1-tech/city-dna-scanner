# Enrealys — Product Status

> **Scope of this document.** A read-only inventory of the *current* codebase. Every
> statement below is based on direct code inspection (routes, providers, hooks,
> persistence, dependencies) — **not** on runtime testing. Where a claim could not be
> verified from code, it is marked *Unverified*. No code was changed to produce this.

**Stack:** Next.js 16.3 (App Router) · React 19 · TypeScript · Tailwind v4 ·
Leaflet / react-leaflet 5 · Recharts · lucide-react. Client-heavy SPA-style app.
**Backend:** none (no database, no auth, no server persistence). **Server code:** a
single API route (`/api/openweather/air-quality`). Build/lint/type-check were observed
passing earlier in this session (`tsc`, `eslint`, `next build` → exit 0).

---

## 1. Feature inventory & functionality status

Status legend: **Functional** = wired to real data/logic and works within its stated
scope · **UI-only / stub** = renders but intentionally does nothing meaningful ·
**Broken / unconfigured** = code exists but cannot succeed in the current config ·
**Unverified** = could not confirm behaviour from code alone.

| # | Feature / route | Component(s) | Status | Notes / evidence |
|---|---|---|---|---|
| 1 | City search (global) | `CitySearch.tsx`, `cities.ts` | **Functional** | Open-Meteo geocoding (keyless) + local catalogue of 20 cities. |
| 2 | Overview dashboard (`/`, `/dashboard`) | `ProfessionalDashboard` → `OverviewDashboard` | **Functional** | Live weather/air/flood/water/green metrics with per-source provenance. Default (non-legacy) render path. |
| 3 | Environmental metric cards | `EnvironmentalMetricCard.tsx` | **Functional** | Shows value/unit/status/source; honest `UNAVAILABLE` when provider missing. |
| 4 | Environmental conditions panel | `HealthAndActions.tsx` | **Functional (no composite score)** | Deterministic per-indicator summary from real provider data: availability count plus each indicator's value, provider data type, caveat and provenance. No composite score, average, percentage or safety rating is computed — "composite score not configured" is stated explicitly. |
| 5 | City map | `InteractiveCityMap.tsx` | **Functional** | Esri Satellite + OSM basemaps, city-centre marker, zoom, fullscreen, Map/Satellite toggle. |
| 6 | Map "Risk layers" panel | `InteractiveCityMap.tsx` + `layers.ts` | **Functional (minimal)** | Checkboxes toggle small colour-coded dots + hover readings from live telemetry. No spatial heatmaps/blobs. |
| 7 | City comparison (`/compare-cities`) | `CityComparison.tsx` | **Functional** | Side-by-side provider values for two cities; no synthetic ranking. |
| 8 | Historical timeline (`/timeline`) | `HistoricalTemperatureChart.tsx` | **Functional** | ERA5 daily temperature reanalysis (Open-Meteo archive) for 7D/30D/1Y/5Y. |
| 9 | City report (`/city-report`) | `UrbanDashboard` (`section=report`) | **Functional** | "Save source snapshot" (localStorage) + "Export data JSON". |
| 10 | Saved reports (`/saved-reports`) | `UrbanDashboard` (`section=saved`) | **Functional (local only)** | Reads `city-dna-saved-reports-v2` from localStorage. |
| 11 | Simulation workspace (`/simulation`) | `SimulationPage`/`SimulationWorkspace` + `simulation.ts` | **Functional (scoped)** | Goals, assumption sliders, Baseline/Simulation, projected-impact cards, timeline chart, results, insights, save + JSON report, compare scenarios. See §3 for the model's real limits. |
| 12 | Simulation map panel | `SimulationMapPanel.tsx` | **Functional (minimal)** | Reuses `InteractiveCityMap`; Baseline/Simulation label; 2D/3D control present but 3D disabled. |
| 13 | Recommendations (`/recommendations`) | `UrbanDashboard` (`section=recommendations`) | **UI-only / stub** | Explicitly states no recommendation engine/dataset is connected; only "Export JSON". |
| 14 | Data & sources (`/data-sources`) | `DataSourcesPage.tsx` | **Functional** | Documents each metric's provider, coverage, limitations. |
| 15 | Settings (`/settings`) | `SettingsPage.tsx` | **Functional (local)** | Metric/Imperial units preference (localStorage). |
| 16 | Organisation Workspace (`/workspace`) | `WorkspacePage`, `WorkspaceProvider`, `WorkspaceSelector` | **Functional (local demo)** | Org profiles, members & permissions table, monitored-facilities table with **live** per-facility risk (heat/air/flood) from each facility city's telemetry. Data is static demo; selection persists in localStorage. Members/permissions are **display-only, not enforced**. |
| 17 | Local Hazard Register | `UrbanDashboard` (hazard widgets) | **Functional (local only)** | User-entered hazard notes stored in `city-dna-hazard-reports-v1`. Not sent anywhere; not on map. |
| 18 | `/alerts` | `app/alerts/page.tsx` | **Redirect** | Server-side redirect to `/simulation`. Vestigial route. |
| 19 | About (`/about`) | `UrbanDashboard` (`section=about`) | **UI-only** | Static marketing/description content. Provider list is slightly stale (omits World Bank & OpenWeather). |
| 20 | OpenWeather air-quality API | `app/api/openweather/air-quality/route.ts` | **Broken / unconfigured** | Requires `OPENWEATHER_API_KEY`, which is **not set** → returns HTTP 503. See §Critical bugs. |

---

## 2. Data source inventory (what is live vs modelled vs historical vs demo)

| Source | Endpoint / origin | Key? | Data class | Used by |
|---|---|---|---|---|
| Open-Meteo Weather (forecast/current) | `api.open-meteo.com` | No | **Modelled** (live) | Weather, apparent temperature |
| Open-Meteo Air Quality (CAMS) | `air-quality-api.open-meteo.com` | No | **Modelled** (live) | US AQI, CO (carbon proxy) |
| Open-Meteo Flood (GloFAS v4) | `flood-api.open-meteo.com` | No | **Modelled** (daily) | River discharge (flood proxy) |
| Open-Meteo Historical (ERA5) | `archive-api.open-meteo.com` | No | **Historical** reanalysis | Timeline chart |
| Open-Meteo Geocoding | `geocoding-api.open-meteo.com` | No | **Live** catalogue | City search |
| World Bank (WHO/UNICEF JMP) | `api.worldbank.org` (SH.H2O.SMDW.ZS) | No | **Historical** (annual, national) | Drinking-water coverage |
| OpenStreetMap features | **Local static index** (`spatialCache.ts` `LOCAL_SPATIAL_INDEX`) | No | **Static demo** (labelled CACHED) | Vegetation & transport feature *counts* — **not** live Overpass |
| OpenWeatherMap | `api.openweathermap.org` | **Yes (missing)** | Reported AQI | Alt air-quality lookup — **currently 503** |
| Esri World Imagery | `server.arcgisonline.com` | No | Live basemap tiles | Map |
| OpenStreetMap tiles | `tile.openstreetmap.org` | No | Live basemap tiles | Map |

**Simulation outputs** (`simulation.ts`): every projection is labelled
**SIMULATED** (documented proportional transform on a *real* baseline) or
**INDICATIVE** (transparent, baseline-anchored proxy with stated method + limitation).
The engine deliberately avoids fabricating values; when no live baseline exists it uses
a documented *reference midpoint* (clearly badged, never presented as a measurement).

**Environmental conditions panel:** the dashboard reports each provider indicator
individually — value, provider data type (Modelled / Historical / Cached / Reported),
caveat and provenance — plus a deterministic count of how many indicators returned
validated provider data. A composite "health" score remains intentionally
**unavailable** (no validated composite methodology is configured).

---

## 3. Known limitations

- **No backend, no database, no authentication.** All persistence is browser
  `localStorage` (units, active organisation, saved scenarios, saved reports, hazards).
  Data is per-browser, lost on clear, and not shared across users/devices.
- **Workspace members & permissions are demo/display-only** — roles are not enforced
  anywhere; there is no real user model.
- **Simulation is not a validated environmental model.** It is a proportional /
  indicative transform over a handful of single-point city indicators (CO proxy,
  vegetation count, discharge). No urban-heat, flood-inundation, or chemical-transport
  physics.
- **Environmental indicators are single-point city-centre values**, not spatial fields;
  the map has no real GIS heat/flood/green overlays (removed to avoid fabrication).
- **Vegetation/transport "metrics" are static demo tallies**, not live OpenStreetMap
  queries.
- **No historical time-series store** — only current values plus on-demand ERA5.
- **No alerting/notifications.** Workspace risk thresholds are computed and displayed,
  but nothing is pushed/emailed.
- **Report export is JSON only** — no professional PDF.
- **3D map** is present as a control but disabled (no 3D data source).
- Open-Meteo's free API terms are **non-commercial** (noted in the app); commercial use
  requires an appropriate subscription.


---

## 4. Critical bugs / risks

1. **`OPENWEATHER_API_KEY` is missing** → `/api/openweather/air-quality` always returns
   **503**. The `UrbanDashboard` air-quality lookup calls this route, so that code path
   cannot succeed in the current configuration (it surfaces an error to the user).
2. **Secrets committed in the working tree.** `src/app/.env.local` contains a
   `GROQ_API_KEY` and a `WAQI_API_KEY`. Both are **unused by any code** (no references
   found in `src`). The file is git-ignored (`.env*`), but real-looking keys sitting in
   the tree are a security/hygiene risk and should be removed or rotated.
3. **Dead dependencies** inflate bundle/maintenance: `axios`, `groq-sdk`,
   `react-hot-toast`, `three`, `@types/three` are declared in `package.json` but
   **not imported anywhere** in `src`. (`groq-sdk` aligns with the unused `GROQ_API_KEY`.)

---

## 5. Commercial-readiness blockers

- **No authentication / multi-user / tenancy.** Members, roles and orgs are not real.
- **No durable server-side storage.** Nothing survives beyond one browser.
- **No alerting engine**, no notifications, no SLA-grade monitoring.
- **No billing / plan management.**
- **No validated analytics** for decision-grade outputs (health score, risk scoring are
  withheld or indicative).
- **Key/secret hygiene** (see §4) and lack of rate-limiting/abuse protection on the one
  server route.
- **Non-commercial upstream data terms** for the keyless providers.

---

## 6. Duplicated / disconnected / unnecessary functionality

- **Two parallel dashboard systems.** `UrbanDashboard.tsx` (~1,000 lines, legacy,
  section-switched) **and** `ProfessionalDashboard` → `OverviewDashboard` (newer design).
  `/` and `/dashboard` render the Professional path; the other sections render the
  Legacy path. Significant duplication.
- **Legacy heat/hazard/flash-flood widgets** in `UrbanDashboard` duplicate `/simulation`
  but compute nothing ("INPUTS ONLY").
- **`/alerts`** is a bare redirect — vestigial.
- **Unused packages** (§4) and **unused env keys** (§4).
- **`about` copy** lists an outdated provider set (omits World Bank & OpenWeather).
- Possibly-unused helpers in `layers.ts` after the map-overlay removal
  (`layerHasData`, `normalizeLayerValue`, `RISK_GRADIENT`) — low priority.

---

## 7. Recommended next 5 development priorities

1. **Authentication + backend persistence.** Introduce real users, organisations,
   facilities and saved artefacts (reports/scenarios) with a database, so the Workspace
   and Simulation features become genuinely multi-user and durable instead of
   localStorage-only. Enforce the member/permission model that is currently display-only.
2. **Fix integrations & secret hygiene.** Set (or remove) `OPENWEATHER_API_KEY`; remove
   or actually wire up the unused `GROQ_API_KEY`/`WAQI_API_KEY`; add a real
   alerting/notification engine driven by the workspace risk thresholds.
3. **Historical time-series storage + trend analytics.** Persist daily snapshots to power
   real dashboards, alerts and reports (today only current values + on-demand ERA5 exist).
4. **Consolidate the UI & trim dependencies.** Retire one of the two dashboard systems,
   and remove dead packages (`axios`, `groq-sdk`, `react-hot-toast`, `three`).
5. **Deliver a validated analytics layer.** Real GIS/spatial risk (Overpass geometry +
   imagery), a defensible composite environmental score, and professional PDF report
   export — upgrading today's *indicative* proxies to validated models where data allows,
   while preserving the project's honest provenance labelling.

---

*Generated from static code inspection. Runtime behaviour of individual providers was
not exercised for this document.*

| 21 | Legacy dashboard widgets (heat "inputs", hazard, flash-flood) | `UrbanDashboard` | **UI-only / disconnected** | Rendered for `section=dashboard|simulation|alerts` in the legacy path; labelled "INPUTS ONLY" and compute nothing. Duplicates the real `/simulation`. |
