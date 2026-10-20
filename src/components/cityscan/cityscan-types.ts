// Types aligned with src/app/api/cityscan/* responses (camelCase as served).
// The dashboard reads these directly — never fabricates scan data; a failing
// or empty API response renders a state, never a stub.

export type ScanStatus =
  | 'ACCEPTED'
  | 'REJECTED_INSUFFICIENT_COMMON_VALID_PIXELS'
  | 'NO_CLEAR_OBSERVATION'
  | 'FAILED';

export type TriggerSource = 'manual' | 'cron';

export interface ObservationSummary {
  id: string;
  itemId: string;
  acquiredAt: string | null;
  platform: string | null;
  tile: string | null;
  processingBaseline: string | null;
  cloudCoverPct: number | null;
  status: ScanStatus;
  validPixels: number | null;
  totalAoiPixels: number;
  commonValidPct: number | null;
  rejectionReason: string | null;
  createdAt: string;
  triggerSource: TriggerSource;
  bandAssets: Record<string, string> | null;
}

export interface FindingSummary {
  id: string;
  cityId: string;
  beforeId: string | null;
  afterId: string | null;
  beforeAcquiredAt: string | null;
  afterAcquiredAt: string | null;
  tile: string | null;
  cloudCoverPctBefore: number | null;
  cloudCoverPctAfter: number | null;
  baselineBefore: string | null;
  baselineAfter: string | null;
  ndviMeanBefore: number | null;
  ndviMeanAfter: number | null;
  ndwiMeanBefore: number | null;
  ndwiMeanAfter: number | null;
  vegetationAreaHaBefore: number | null;
  vegetationAreaHaAfter: number | null;
  waterAreaHaBefore: number | null;
  waterAreaHaAfter: number | null;
  vegetationLossHa: number | null;
  vegetationGainHa: number | null;
  waterGainHa: number | null;
  waterLossHa: number | null;
  pixelAreaHa: number | null;
  commonValidPct: number | null;
  quorumRequiredPct: number | null;
  methodVersion: string | null;
  createdAt: string;
}

export interface PairsResponse {
  cityId: string;
  count: number;
  pairs: FindingSummary[];
}

export interface ObservationsResponse {
  cityId: string;
  count: number;
  observations: ObservationSummary[];
}

export interface FindingDetail {
  id: string;
  cityId: string;
  beforeId: string | null;
  afterId: string | null;
  beforeAcquiredAt: string | null;
  afterAcquiredAt: string | null;
  tile: string | null;
  cloudCoverPctBefore: number | null;
  cloudCoverPctAfter: number | null;
  baselineBefore: string | null;
  baselineAfter: string | null;
  ndviMeanBefore: number | null;
  ndviMeanAfter: number | null;
  ndwiMeanBefore: number | null;
  ndwiMeanAfter: number | null;
  vegetationAreaHaBefore: number | null;
  vegetationAreaHaAfter: number | null;
  waterAreaHaBefore: number | null;
  waterAreaHaAfter: number | null;
  vegetationLossHa: number | null;
  vegetationGainHa: number | null;
  waterGainHa: number | null;
  waterLossHa: number | null;
  pixelAreaHa: number | null;
  commonValidPct: number | null;
  quorumRequiredPct: number | null;
  methodVersion: string | null;
  createdAt: string;
}

export interface ScanRunResponse {
  status: ScanStatus;
  cityId: string;
  persisted: boolean;
  observationId: string | null;
  beforeObservationId: string | null;
  afterObservationId: string | null;
  findingId: string | null;
  itemIds: (string | null)[];
  dates: { before: string | null; after: string | null };
  tile: string | null;
  epsg: number | null;
  totalAoiPixels: number | null;
  commonValidPixels: number | null;
  commonValidPct: number | null;
  quorumRequiredPct: number;
  rejectionReason: string | null;
  metrics: {
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
  } | null;
  discoveryWindowDays: number;
  discoveryMatched: number;
  cloudCoverPctBefore: number | null;
  cloudCoverPctAfter: number | null;
  baselineBefore: string | null;
  baselineAfter: string | null;
}

export interface CityScanError {
  status: number;
  message: string;
  hint?: string;
}

export function isScanStatus(value: string): value is ScanStatus {
  return (
    value === 'ACCEPTED' ||
    value === 'REJECTED_INSUFFICIENT_COMMON_VALID_PIXELS' ||
    value === 'NO_CLEAR_OBSERVATION' ||
    value === 'FAILED'
  );
}

export function isTriggerSource(value: string): value is TriggerSource {
  return value === 'manual' || value === 'cron';
}

/** The five launch cities configured for this phase (placeholder geography). */
export const LAUNCH_CITY_IDS = [
  'london',
  'paris',
  'amsterdam',
  'berlin',
  'tokyo',
] as const;

export type LaunchCityId = (typeof LAUNCH_CITY_IDS)[number];

export function isLaunchCityId(value: string): value is LaunchCityId {
  return (LAUNCH_CITY_IDS as readonly string[]).includes(value);
}

/** City catalog from environment (government placeholder geography, no real tiles). */
export function filterLaunchCities(cities: Array<{ id: string }>): Array<{ id: string }> {
  return cities.filter((city) => isLaunchCityId(city.id));
}
