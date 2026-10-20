/**
 * Public-view row shapes and mappers (Phase 4C public-first reads).
 *
 * The cityscan_public_* views (supabase/migrations/cityscan_public_views.sql)
 * expose an explicit allowlist: accepted scan rows only, never org_id /
 * created_by / band_assets / window_pixels, and never rejected or unpublished
 * scan output. The mappers produce the same camelCase response shape as the
 * org-scoped routes, so the dashboard never needs to know which source served
 * the data. Private fields that simply do not exist on the public surface are
 * returned as null — never fabricated.
 */

export interface PublicFindingRow {
  id: string;
  city_id: string;
  created_at: string;
  method_version: string | null;
  quorum_required_pct: number;
  common_valid_pct: number | null;
  ndvi_mean_before: number | null;
  ndvi_mean_after: number | null;
  ndwi_mean_before: number | null;
  ndwi_mean_after: number | null;
  vegetation_area_ha_before: number | null;
  vegetation_area_ha_after: number | null;
  water_area_ha_before: number | null;
  water_area_ha_after: number | null;
  vegetation_loss_ha: number | null;
  vegetation_gain_ha: number | null;
  water_gain_ha: number | null;
  water_loss_ha: number | null;
  pixel_area_ha: number | null;
  before_item_id: string | null;
  before_acquired_at: string | null;
  before_tile: string | null;
  before_cloud_cover_pct: number | null;
  before_processing_baseline: string | null;
  after_item_id: string | null;
  after_acquired_at: string | null;
  after_tile: string | null;
  after_cloud_cover_pct: number | null;
  after_processing_baseline: string | null;
}

export interface PublicObservationRow {
  id: string;
  item_id: string;
  acquired_at: string | null;
  platform: string | null;
  tile: string | null;
  processing_baseline: string | null;
  cloud_cover_pct: number | null;
  valid_pixels: number | null;
  total_aoi_pixels: number;
  common_valid_pct: number | null;
  status: string;
  trigger_source: string | null;
  created_at: string;
}

/** Accepted-pair row → `/api/cityscan/pairs` entry. */
export function mapPublicFindingSummary(row: PublicFindingRow) {
  return {
    id: row.id,
    cityId: row.city_id,
    beforeId: row.before_item_id,
    afterId: row.after_item_id,
    beforeAcquiredAt: row.before_acquired_at,
    afterAcquiredAt: row.after_acquired_at,
    tile: row.after_tile,
    cloudCoverPctBefore: row.before_cloud_cover_pct,
    cloudCoverPctAfter: row.after_cloud_cover_pct,
    baselineBefore: row.before_processing_baseline,
    baselineAfter: row.after_processing_baseline,
    ndviMeanBefore: row.ndvi_mean_before,
    ndviMeanAfter: row.ndvi_mean_after,
    ndwiMeanBefore: row.ndwi_mean_before,
    ndwiMeanAfter: row.ndwi_mean_after,
    vegetationAreaHaBefore: row.vegetation_area_ha_before,
    vegetationAreaHaAfter: row.vegetation_area_ha_after,
    waterAreaHaBefore: row.water_area_ha_before,
    waterAreaHaAfter: row.water_area_ha_after,
    vegetationLossHa: row.vegetation_loss_ha,
    vegetationGainHa: row.vegetation_gain_ha,
    waterGainHa: row.water_gain_ha,
    waterLossHa: row.water_loss_ha,
    pixelAreaHa: row.pixel_area_ha,
    commonValidPct: row.common_valid_pct,
    quorumRequiredPct: row.quorum_required_pct,
    methodVersion: row.method_version,
    createdAt: row.created_at,
  };
}

/** Accepted-pair row → `/api/cityscan/findings` detail payload. */
export function mapPublicFindingDetail(row: PublicFindingRow) {
  return mapPublicFindingSummary(row);
}

/** Accepted observation row → `/api/cityscan/observations` entry. */
export function mapPublicObservation(row: PublicObservationRow) {
  return {
    id: row.id,
    itemId: row.item_id,
    acquiredAt: row.acquired_at,
    platform: row.platform,
    tile: row.tile,
    processingBaseline: row.processing_baseline,
    cloudCoverPct: row.cloud_cover_pct,
    status: row.status,
    validPixels: row.valid_pixels,
    totalAoiPixels: row.total_aoi_pixels,
    commonValidPct: row.common_valid_pct,
    // Rejected scans are never published on the public surface; accepted rows
    // carry no rejection reason. Internal STAC band hrefs stay internal too.
    rejectionReason: null,
    createdAt: row.created_at,
    triggerSource: row.trigger_source ?? 'manual',
    bandAssets: null,
  };
}
