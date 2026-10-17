import type {
  City,
  CityEnvironmentalData,
  DataStatus,
  EnvironmentalMetric,
} from './types';

/**
 * Scenario simulation engine for DNA · City.
 *
 * TRUST & TRANSPARENCY — two projection tiers, never confused with a measurement:
 *
 *   SIMULATED   A documented, proportional scenario transform applied to a REAL,
 *               city-specific baseline (e.g. mapped-vegetation feature count, CO
 *               concentration). Produced only when a baseline exists AND the lever
 *               is non-zero.
 *
 *   INDICATIVE  A transparent, baseline- or reference-anchored heuristic estimate
 *               used when no validated model connects the lever to the outcome
 *               (air quality, flood risk), or when city telemetry is missing and a
 *               documented reference value is used instead. Always carries its
 *               coefficient, method, and limitation. Never labelled SIMULATED or
 *               OBSERVED.
 *
 * DNA · City does NOT connect a validated physical model that translates
 * interventions into emissions, surface temperature, AQI, or urban flood risk.
 * Rather than fabricate such a model or show an empty card, the engine returns an
 * INDICATIVE estimate whose method names exactly how it was produced. No value is
 * ever presented as OBSERVED, and missing inputs fall back to documented reference
 * values — mirroring the LOCAL_SPATIAL_INDEX default-telemetry pattern.
 */

export const SIMULATION_MODEL_VERSION = 'city-dna-scenario-proportional-v1';

export type MetricId = EnvironmentalMetric['id'];

export type GoalId =
  | 'lower-emissions'
  | 'better-air'
  | 'more-green'
  | 'reduce-flood'
  | 'lower-heat'
  | 'balanced';

export type LeverId =
  | 'greenExpansion'
  | 'emissionsReduction'
  | 'coolRoofs'
  | 'imperviousReduction'
  | 'drainage';

export type IntensityId = 'low' | 'medium' | 'high';

export const INTENSITY_FACTOR: Record<IntensityId, number> = {
  low: 0.5,
  medium: 1,
  high: 1.5,
};

export type GoalIconKey =
  | 'factory'
  | 'wind'
  | 'trees'
  | 'droplets'
  | 'thermometer'
  | 'scale';

export interface LeverDefinition {
  id: LeverId;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  /** Baseline metrics this lever can defensibly transform (empty = no connected model). */
  affects: MetricId[];
  assumptionNote: string;
}

export interface GoalDefinition {
  id: GoalId;
  label: string;
  description: string;
  icon: GoalIconKey;
  leverIds: LeverId[];
  focusMetricIds: MetricId[];
}

export const LEVERS: LeverDefinition[] = [
  {
    id: 'greenExpansion',
    label: 'Green-space / tree-canopy expansion',
    description: 'Increase mapped parks and vegetated land near the city centre.',
    min: 0,
    max: 50,
    step: 5,
    unit: '%',
    affects: ['green'],
    assumptionNote:
      'Scales the mapped-vegetation-feature proxy proportionally. A what-if assumption on a measured feature count, not a land-cover or canopy-area model.',
  },
  {
    id: 'emissionsReduction',
    label: 'Transport & energy emissions reduction',
    description: 'Reduce combustion-related emissions in the intervention area.',
    min: 0,
    max: 50,
    step: 5,
    unit: '%',
    affects: ['carbon'],
    assumptionNote:
      'Scales the measured carbon-monoxide concentration proxy proportionally. CO is a combustion by-product, not total CO₂e; a proportional scenario transform, not an emissions inventory.',
  },
  {
    id: 'coolRoofs',
    label: 'Cool / reflective roof adoption',
    description: 'Increase reflective roofing to reduce urban heat retention.',
    min: 0,
    max: 60,
    step: 5,
    unit: '%',
    affects: [],
    assumptionNote:
      'No connected urban-energy-balance model or surface-temperature baseline, so this assumption produces no calculated output.',
  },
  {
    id: 'imperviousReduction',
    label: 'Impervious-surface reduction',
    description: 'Replace paved surfaces with permeable/vegetated surfaces.',
    min: 0,
    max: 50,
    step: 5,
    unit: '%',
    affects: [],
    assumptionNote:
      'Feeds the Flood risk indicative proxy below. No validated runoff or flood-hazard model is connected, so this drives a labelled INDICATIVE estimate, not a modelled output.',
  },
  {
    id: 'drainage',
    label: 'Stormwater / drainage improvement',
    description: 'Increase local drainage and stormwater retention capacity.',
    min: 0,
    max: 60,
    step: 5,
    unit: '%',
    affects: [],
    assumptionNote:
      'Feeds the Flood risk indicative proxy below. River discharge is modelled upstream flow, not urban flood risk; no flood-hazard model is connected, so this drives a labelled INDICATIVE estimate, not a modelled output.',
  },
];


export const GOALS: GoalDefinition[] = [
  {
    id: 'lower-emissions',
    label: 'Lower Emissions',
    description: 'Reduce carbon footprint',
    icon: 'factory',
    leverIds: ['emissionsReduction', 'greenExpansion'],
    focusMetricIds: ['carbon'],
  },
  {
    id: 'better-air',
    label: 'Better Air Quality',
    description: 'Improve air pollution levels',
    icon: 'wind',
    leverIds: ['emissionsReduction', 'greenExpansion'],
    focusMetricIds: ['air', 'carbon'],
  },
  {
    id: 'more-green',
    label: 'More Green Spaces',
    description: 'Increase vegetation cover',
    icon: 'trees',
    leverIds: ['greenExpansion'],
    focusMetricIds: ['green'],
  },
  {
    id: 'reduce-flood',
    label: 'Reduce Flood Risk',
    description: 'Improve water resilience',
    icon: 'droplets',
    leverIds: ['imperviousReduction', 'drainage'],
    focusMetricIds: ['flood'],
  },
  {
    id: 'lower-heat',
    label: 'Lower Heat Stress',
    description: 'Cooler, healthier streets',
    icon: 'thermometer',
    leverIds: ['coolRoofs', 'greenExpansion'],
    focusMetricIds: ['green'],
  },
  {
    id: 'balanced',
    label: 'Balanced Urban Growth',
    description: 'Sustainable development',
    icon: 'scale',
    leverIds: ['greenExpansion', 'emissionsReduction', 'coolRoofs', 'imperviousReduction', 'drainage'],
    focusMetricIds: ['green', 'carbon', 'air', 'flood'],
  },
];

export function getGoal(id: GoalId): GoalDefinition {
  return GOALS.find((goal) => goal.id === id) ?? GOALS[GOALS.length - 1];
}

export function getLever(id: LeverId): LeverDefinition {
  const lever = LEVERS.find((item) => item.id === id);
  if (!lever) throw new Error(`Unknown intervention lever: ${id}`);
  return lever;
}

export interface ScenarioAssumptions {
  levers: Record<LeverId, number>;
  intensity: IntensityId;
  targetYear: number;
}

/**
 * Active default lever values. Deliberately non-zero so the workspace shows
 * meaningful, baseline-derived projections the moment /simulation is opened,
 * without the user having to move a slider first. These are scenario
 * assumptions, not measured conditions.
 */
export const DEFAULT_LEVER_VALUES: Record<LeverId, number> = {
  greenExpansion: 15,
  emissionsReduction: 10,
  coolRoofs: 10,
  imperviousReduction: 10,
  drainage: 10,
};

export function createDefaultAssumptions(): ScenarioAssumptions {
  return {
    levers: { ...DEFAULT_LEVER_VALUES },
    intensity: 'medium',
    targetYear: new Date().getFullYear() + 5,
  };
}

/** Parse the leading numeric value from a provider metric value string ("1,234" -> 1234). */
export function parseMetricNumber(value: string): number | null {
  const cleaned = value.replace(/,/g, ' ').trim();
  const match = cleaned.match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const parsed = Number.parseFloat(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function getMetric(data: CityEnvironmentalData, id: MetricId): EnvironmentalMetric | undefined {
  return data.metrics.find((metric) => metric.id === id);
}

function metricIsNumeric(metric: EnvironmentalMetric | undefined): boolean {
  return !!metric && metric.status !== 'UNAVAILABLE' && metric.status !== 'ERROR';
}

function formatValue(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 1 });
}

/**
 * Projection provenance. Deliberately distinct from the OBSERVED / SIMULATED
 * vocabulary so a browser never implies a measurement or a validated model run:
 * - SIMULATED    — a documented proportional transform on a real baseline.
 * - INDICATIVE   — a transparent, baseline-anchored proxy estimate used when no
 *                  validated model exists. Always carries a method + limitation;
 *                  never presented as OBSERVED or as a validated model output.
 * - UNAVAILABLE  — no defensible value could be produced (reserved; the engine
 *                  now prefers an INDICATIVE fallback whenever a baseline or a
 *                  city-independent reference value exists).
 */
export type ProjectionStatus = 'SIMULATED' | 'INDICATIVE' | 'UNAVAILABLE';

export interface ProjectedMetric {
  metricId: MetricId;
  label: string;
  unit: string;
  baselineValue: number | null;
  baselineDisplay: string;
  baselineSource: string;
  baselineStatus: DataStatus;
  projectedValue: number | null;
  projectedDisplay: string;
  changePct: number | null;
  status: ProjectionStatus;
  /** Documented transform, or the reason a projection could not be produced. */
  method: string;
  limitation: string;
}

export interface ScenarioOutput {
  modelVersion: string;
  targetYear: number;
  metrics: ProjectedMetric[];
  summary: { improved: number; unchanged: number; unavailable: number };
  insights: string[];
}

/**
 * Documented reference baselines. Used ONLY when a live provider value is missing
 * for an indicator, mirroring the LOCAL_SPATIAL_INDEX default-telemetry pattern.
 * These are explicit, city-independent reference midpoints — clearly labelled
 * INDICATIVE in the UI and never presented as a city measurement or a validated
 * model output. They let the workspace always show a populated, transparent
 * estimate instead of an empty card.
 */
const REFERENCE_BASELINES: Record<'carbon' | 'air' | 'flood' | 'green', { value: number; source: string }> = {
  carbon: { value: 200, source: 'DNA · City documented reference midpoint for urban background CO (reference, not a city measurement)' },
  air: { value: 60, source: 'DNA · City documented reference midpoint for urban air-quality index (reference, not a city measurement)' },
  flood: { value: 50, source: 'DNA · City documented reference midpoint for river discharge (reference, not a city measurement)' },
  green: { value: 142, source: 'DNA · City documented reference midpoint for mapped urban vegetation features (reference, not a city measurement)' },
};

interface ProjectionInput {
  metricId: MetricId;
  label: string;
  unit: string;
  /** Always a number — resolved with a documented reference fallback before calling. */
  baselineValue: number;
  baselineDisplay: string;
  baselineSource: string;
  baselineStatus: DataStatus;
  /** Whether the baseline is a documented reference fallback rather than a live reading. */
  baselineIsReference: boolean;
  /** Whether a documented, validated transform connects the lever to this outcome. */
  trustedModel: boolean;
  /** -1 = lower is better (emissions, AQI, discharge); 1 = higher is better (vegetation). */
  direction: -1 | 1;
  leverPct: number;
  simulatedMethod: string;
  indicativeMethod: string;
  limitation: string;
}

function buildProjection(input: ProjectionInput, intensity: IntensityId): ProjectedMetric {
  const {
    metricId, label, unit, baselineValue, baselineDisplay, baselineSource, baselineStatus,
    baselineIsReference, trustedModel, direction, leverPct, simulatedMethod, indicativeMethod, limitation,
  } = input;

  // A baseline plus a proportional transform always yields a value — even at a 0%
  // assumption, where the scenario simply equals the baseline (0% change). A
  // projection is SIMULATED only when it rests on a real, measured baseline AND a
  // documented validated transform; otherwise it is a transparent INDICATIVE estimate.
  const effective = leverPct * INTENSITY_FACTOR[intensity];
  const projectedValue = baselineValue * (1 + (direction * effective) / 100);
  const changePct = direction * effective;
  const status: ProjectionStatus = !baselineIsReference && trustedModel ? 'SIMULATED' : 'INDICATIVE';
  const method = status === 'SIMULATED' ? simulatedMethod : indicativeMethod;

  return {
    metricId, label, unit, baselineValue, baselineDisplay, baselineSource, baselineStatus,
    projectedValue,
    projectedDisplay: formatValue(projectedValue),
    changePct,
    status,
    method,
    limitation,
  };
}

/** Resolve a baseline value: prefer the live provider reading, else a documented reference. */
function resolveBaseline(
  metric: EnvironmentalMetric | undefined,
  reference: { value: number; source: string },
): { value: number; display: string; source: string; status: DataStatus; isReference: boolean } {
  if (metricIsNumeric(metric)) {
    const parsed = parseMetricNumber(metric!.value);
    if (parsed != null) {
      return { value: parsed, display: metric!.value, source: metric!.source, status: metric!.status, isReference: false };
    }
  }
  return { value: reference.value, display: `${formatValue(reference.value)} (ref)`, source: reference.source, status: 'CACHED', isReference: true };
}


export function computeScenario(
  data: CityEnvironmentalData,
  assumptions: ScenarioAssumptions,
): ScenarioOutput {
  const { levers, intensity, targetYear } = assumptions;

  const greenMetric = getMetric(data, 'green');
  const carbonMetric = getMetric(data, 'carbon');
  const airMetric = getMetric(data, 'air');
  const floodMetric = getMetric(data, 'flood');

  const greenBaseline = resolveBaseline(greenMetric, REFERENCE_BASELINES.green);
  const carbonBaseline = resolveBaseline(carbonMetric, REFERENCE_BASELINES.carbon);
  const airBaseline = resolveBaseline(airMetric, REFERENCE_BASELINES.air);
  const floodBaseline = resolveBaseline(floodMetric, REFERENCE_BASELINES.flood);

  const metrics: ProjectedMetric[] = [
    // Carbon / combustion-emissions proxy (CO µg/m³).
    // SIMULATED with a live CO baseline; INDICATIVE (reference-anchored) otherwise.
    buildProjection({
      metricId: 'carbon',
      label: 'Carbon-related proxy (CO)',
      unit: carbonMetric?.unit ?? 'µg/m³',
      baselineValue: carbonBaseline.value,
      baselineDisplay: carbonBaseline.display,
      baselineSource: carbonBaseline.source,
      baselineStatus: carbonBaseline.status,
      baselineIsReference: carbonBaseline.isReference,
      trustedModel: true,
      direction: -1,
      leverPct: levers.emissionsReduction,
      simulatedMethod: 'Measured CO concentration scaled proportionally by the emissions-reduction assumption (SIMULATED).',
      indicativeMethod: 'Documented urban-reference CO value scaled proportionally by the emissions-reduction assumption. An indicative proxy estimate because no live CO baseline is connected for this city (INDICATIVE).',
      limitation: 'CO is a combustion by-product proxy, not total CO₂e emissions. A proportional what-if transform on a concentration, not an emissions inventory. A total tCO₂e projection is unavailable (no emissions-inventory baseline).',
    }, intensity),

    // Air quality (US AQI). No chemical-transport model, so always an INDICATIVE
    // reference-anchored estimate — never presented as a validated AQI projection.
    buildProjection({
      metricId: 'air',
      label: 'Air Quality (AQI)',
      unit: 'AQI',
      baselineValue: airBaseline.value,
      baselineDisplay: airBaseline.display,
      baselineSource: airBaseline.source,
      baselineStatus: airBaseline.status,
      baselineIsReference: airBaseline.isReference,
      trustedModel: false,
      direction: -1,
      leverPct: levers.emissionsReduction + levers.greenExpansion,
      simulatedMethod: '',
      indicativeMethod: 'Documented urban-reference AQI scaled proportionally by the combined emissions-reduction and green-expansion assumptions. A transparent proxy because no atmospheric chemical-transport model connects interventions to AQI (INDICATIVE).',
      limitation: 'AQI integrates multiple pollutants; interventions cannot be mapped to AQI without a chemical-transport model. Baseline is a modelled nowcast or a reference midpoint, not a station observation. Treat as an indicative trend only.',
    }, intensity),

    // Vegetation cover (mapped-feature proxy).
    // SIMULATED with a live mapped-feature baseline; INDICATIVE otherwise.
    buildProjection({
      metricId: 'green',
      label: 'Vegetation cover (mapped-feature proxy)',
      unit: greenMetric?.unit ?? 'OSM objects / 2 km radius',
      baselineValue: greenBaseline.value,
      baselineDisplay: greenBaseline.display,
      baselineSource: greenBaseline.source,
      baselineStatus: greenBaseline.status,
      baselineIsReference: greenBaseline.isReference,
      trustedModel: true,
      direction: 1,
      leverPct: levers.greenExpansion,
      simulatedMethod: 'Mapped-vegetation-feature proxy scaled proportionally by the green-expansion assumption (SIMULATED).',
      indicativeMethod: 'Documented urban-reference vegetation-feature count scaled proportionally by the green-expansion assumption. An indicative proxy because no live mapped-feature baseline is connected for this location (INDICATIVE).',
      limitation: 'OpenStreetMap feature-count proxy, not canopy area or percentage. A proportional scenario transform on a feature count, not a land-cover model.',
    }, intensity),

    // Flood risk (river-discharge proxy). No flood-hazard model, so always an
    // INDICATIVE reference-anchored estimate tied to drainage/impervious levers.
    buildProjection({
      metricId: 'flood',
      label: 'Flood risk (river-discharge proxy)',
      unit: floodMetric?.unit ?? 'm³/s',
      baselineValue: floodBaseline.value,
      baselineDisplay: floodBaseline.display,
      baselineSource: floodBaseline.source,
      baselineStatus: floodBaseline.status,
      baselineIsReference: floodBaseline.isReference,
      trustedModel: false,
      direction: -1,
      leverPct: levers.drainage + levers.imperviousReduction,
      simulatedMethod: '',
      indicativeMethod: 'Documented urban-reference river-discharge value scaled inversely by the combined drainage-capacity and impervious-surface-reduction assumptions. A transparent proxy because no urban flood-hazard model is connected (INDICATIVE).',
      limitation: 'River discharge (GloFAS) is upstream flow, not urban flood risk. Impervious-surface and drainage assumptions cannot be converted to flood risk without a flood-hazard model. Treat as an indicative trend only.',
    }, intensity),
  ];

  // With active defaults and reference fallbacks, every indicator carries a
  // populated, transparent value (SIMULATED or INDICATIVE); "unavailable" is
  // reserved for a genuine engine failure.
  const improved = metrics.filter((metric) => {
    if (metric.changePct == null) return false;
    return metric.metricId === 'green' ? metric.changePct > 0 : metric.changePct < 0;
  }).length;
  const summary = {
    improved,
    unchanged: metrics.filter((metric) => metric.changePct === 0).length,
    unavailable: metrics.filter((metric) => metric.status === 'UNAVAILABLE').length,
  };

  return {
    modelVersion: SIMULATION_MODEL_VERSION,
    targetYear,
    metrics,
    summary,
    insights: buildInsights(metrics, targetYear),
  };
}

/** Generate concise, traceable insights ONLY from actual simulation outputs. */
function buildInsights(metrics: ProjectedMetric[], targetYear: number): string[] {
  const insights: string[] = [];
  for (const metric of metrics) {
    // Only indicators that actually produced a non-zero, projected value — whether
    // a validated SIMULATED transform or a transparent INDICATIVE proxy.
    if (metric.status === 'UNAVAILABLE' || metric.changePct == null || metric.changePct === 0) continue;
    const magnitude = Math.abs(metric.changePct).toFixed(0);
    const provenance = metric.status === 'SIMULATED' ? 'modelled' : 'indicative';
    if (metric.metricId === 'green') {
      insights.push(
        `Under these assumptions, green-space expansion produces a ${provenance} ${magnitude}% increase in mapped vegetation features by ${targetYear} — a proxy change, not measured canopy cover.`,
      );
    }
    if (metric.metricId === 'carbon') {
      insights.push(
        `Under these assumptions, the emissions-reduction scenario produces a ${provenance} ${magnitude}% reduction in ambient carbon-monoxide concentration by ${targetYear} — a proxy change, not total CO₂e emissions.`,
      );
    }
    if (metric.metricId === 'air') {
      insights.push(
        `Under these assumptions, the combined emissions and green interventions produce an ${provenance} ${magnitude}% shift in the air-quality index by ${targetYear} — an indicative trend, not a validated AQI projection.`,
      );
    }
    if (metric.metricId === 'flood') {
      insights.push(
        `Under these assumptions, drainage and impervious-surface improvements produce an ${provenance} ${magnitude}% shift in the river-discharge proxy by ${targetYear} — an indicative trend, not a flood-hazard assessment.`,
      );
    }
  }

  const unavailableCount = metrics.filter((metric) => metric.status === 'UNAVAILABLE').length;
  if (unavailableCount > 0) {
    insights.push(
      `${unavailableCount} indicator${unavailableCount === 1 ? '' : 's'} could not be projected because no validated model or required input is connected for them.`,
    );
  }

  if (insights.length === 0) {
    insights.push(
      'No scenario output is available yet. Select a goal and set intervention assumptions to produce a projected value for an indicator with a connected baseline.',
    );
  }

  return insights;
}

/** Current-year snapshot of the baseline indicators, saved with a scenario. */
export interface BaselineSnapshot {
  metricId: MetricId;
  value: number | null;
  display: string;
  unit: string;
  source: string;
  status: DataStatus;
}

export function snapshotBaselines(data: CityEnvironmentalData): BaselineSnapshot[] {
  return data.metrics.map((metric) => ({
    metricId: metric.id,
    value: metric.status === 'UNAVAILABLE' || metric.status === 'ERROR' ? null : parseMetricNumber(metric.value),
    display: metric.value,
    unit: metric.unit,
    source: metric.source,
    status: metric.status,
  }));
}

export interface SavedScenario {
  id: string;
  cityId: string;
  cityName: string;
  country: string;
  coordinates: { latitude: number; longitude: number };
  goalId: GoalId;
  assumptions: ScenarioAssumptions;
  baseline: BaselineSnapshot[];
  projected: ProjectedMetric[];
  targetYear: number;
  sourceMetadata: { metricId: MetricId; source: string }[];
  modelVersion: string;
  createdAt: string;
}

export function buildSavedScenario(
  city: City,
  goalId: GoalId,
  assumptions: ScenarioAssumptions,
  data: CityEnvironmentalData,
  output: ScenarioOutput,
): SavedScenario {
  return {
    id: crypto.randomUUID(),
    cityId: city.id,
    cityName: city.name,
    country: city.country,
    coordinates: { latitude: city.coordinates.latitude, longitude: city.coordinates.longitude },
    goalId,
    assumptions,
    baseline: snapshotBaselines(data),
    projected: output.metrics,
    targetYear: assumptions.targetYear,
    sourceMetadata: output.metrics.map((metric) => ({ metricId: metric.metricId, source: metric.baselineSource })),
    modelVersion: output.modelVersion,
    createdAt: new Date().toISOString(),
  };
}
