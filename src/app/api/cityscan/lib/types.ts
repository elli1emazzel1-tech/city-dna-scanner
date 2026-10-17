/**
 * Shared row/result types for the CityScan API routes.
 *
 * Mirrors the shapes produced by supabase/migrations/cityscan.sql and by
 * src/lib/cityscan/scan.cjs `runScan()` so route handlers stay fully typed
 * without explicit `any`.
 */

/** Brief observation data joined onto findings. */
export interface ObservationBrief {
  id: string;
  item_id: string;
  acquired_at: string;
  tile: string;
  cloud_cover_pct: number;
  processing_baseline: string;
}

/** A cityscan_findings row joined with its before/after observations. */
export interface FindingRow {
  id: string;
  city_id: string;
  before_observation: ObservationBrief | null;
  after_observation: ObservationBrief | null;
  ndvi_mean_before: number | null;
  ndvi_mean_after: number | null;
  ndwi_mean_before: number | null;
  ndwi_mean_after: number | null;
  vegetation_area_ha_before: number | null;
  vegetation_area_ha_after: number | null;
  water_area_ha_before: number | null;
  water_area_ha_after: number | null;
  vegetation_loss_ha: number;
  vegetation_gain_ha: number;
  water_gain_ha: number;
  water_loss_ha: number;
  pixel_area_ha: number;
  common_valid_pct: number;
  quorum_required_pct: number;
  method_version: string;
  created_at: string;
}

/** Change metrics block returned by runScan() when the quorum is met. */
export interface ScanMetrics {
  ndviMeanBefore: number;
  ndviMeanAfter: number;
  ndwiMeanBefore: number;
  ndwiMeanAfter: number;
  vegetationAreaHaBefore: number;
  vegetationAreaHaAfter: number;
  waterClassifiedAreaHaBefore: number;
  waterClassifiedAreaHaAfter: number;
  vegetationLossThresholdAreaHa: number;
  vegetationGainThresholdAreaHa: number;
  waterGainThresholdAreaHa: number;
  waterLossThresholdAreaHa: number;
  pixelAreaHa: number;
}

/** Full shape of the runScan() result from src/lib/cityscan/scan.cjs. */
export interface ScanResult {
  status: 'ACCEPTED' | 'REJECTED_INSUFFICIENT_COMMON_VALID_PIXELS';
  method: string;
  quorumRequiredPct: number;
  before: { id: string; datetime: string; [key: string]: unknown };
  after: { id: string; datetime: string; [key: string]: unknown };
  tile: string;
  epsg: number;
  totalAoiPixels: number;
  commonValidPixels: number;
  commonValidPct: number;
  rejectionReason?: string;
  metrics: ScanMetrics | null;
}