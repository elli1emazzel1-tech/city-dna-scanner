import type { City } from './types';

export interface CityPopulation {
  figure: number;
  year: number | null;
  sourceUrl: string;
  wikidataId: string;
  entityLabel: string;
}

const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const FAILURE_CACHE_TTL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 12_000;

/**
 * Direct instance-of (P31) classes that identify the settlement entity itself
 * — its city proper. Verified one by one against live entities:
 * - city (Q515): London Q84, Mumbai Q1156, New York City Q60
 * - capital city (Q2264924): Amsterdam Q727, New York City Q60
 * - town (Q3957): covers town-typed settlements
 * - metropolis (Q200250): London, Mumbai, NYC and Berlin Q64 all carry it.
 *   This is a settlement category — verified distinct from "metropolitan
 *   area" and region items, which are intentionally NOT in this set.
 * - commune of France (Q484170): Paris Q90's city-proper administrative unit.
 *
 * Municipalities (e.g. Amsterdam Q9899), states (New York Q1384), districts,
 * regions (e.g. London region Q23939248), megalopolis (Q471822) and
 * metropolitan areas are deliberately absent so their figures are never
 * substituted for a city population.
 */
const SETTLEMENT_CLASS_IDS = new Set(['Q515', 'Q2264924', 'Q3957', 'Q200250', 'Q484170']);

interface WikidataStatement {
  rank?: string;
  mainsnak?: { datavalue?: { value?: { id?: string; amount?: string } | string } };
  qualifiers?: { P585?: Array<{ datavalue?: { value?: { time?: string } } }> };
}

interface WikidataEntity {
  id?: string;
  labels?: { en?: { value?: string } };
  claims?: {
    P31?: WikidataStatement[];
    P17?: WikidataStatement[];
    P297?: WikidataStatement[];
    P1082?: WikidataStatement[];
  };
}

function wikidataApi(params: Record<string, string>) {
  const url = new URL(WIKIDATA_API);
  url.search = new URLSearchParams({ format: 'json', origin: '*', ...params }).toString();
  return url;
}

async function fetchWikidataJson(url: URL): Promise<unknown> {
  let lastError: unknown = new Error('Wikidata request failed.');
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      if (response.status === 429 || response.status >= 500) {
        lastError = new Error(`Wikidata returned HTTP ${response.status}.`);
        const retryAfter = Number(response.headers.get('retry-after'));
        const cappedAfter = Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 10) : 0;
        // Exponential backoff with jitter: 900ms → 1.8s → ~4s, plus any Retry-After.
        const waitMs = Math.min(cappedAfter * 1000 + 900 * 2 ** attempt + Math.random() * 400, 12_000);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }
      if (!response.ok) throw new Error(`Wikidata returned HTTP ${response.status}.`);
      return await response.json() as unknown;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function statementValueId(statement?: WikidataStatement): string | null {
  const value = statement?.mainsnak?.datavalue?.value;
  return typeof value === 'object' && value !== null && typeof value.id === 'string' ? value.id : null;
}

/** ISO 3166-1 alpha-2 codes (P297) are plain string datavalues, not entity references. */
function statementIsoCode(statement?: WikidataStatement): string | null {
  const value = statement?.mainsnak?.datavalue?.value;
  return typeof value === 'string' && /^[A-Za-z]{2}$/.test(value) ? value.toUpperCase() : null;
}

function normalizeName(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('en');
}

function labelMatchesExact(label: string, cityName: string) {
  return normalizeName(label) === normalizeName(cityName);
}

/**
 * Preference order for competing same-label entities, lower is better:
 * city (Q515) > capital city (Q2264924) > town (Q3957) > commune of France
 * (Q484170) > metropolis (Q200250). Exact English label is required — the
 * relaxed "starts with" fallback is gone, so "New York" can never silently
 * resolve to something merely containing those words.
 */
const CLASS_PRIORITY: Record<string, number> = {
  Q515: 0,
  Q2264924: 1,
  Q3957: 2,
  Q484170: 3,
  Q200250: 4,
};

function bestClassPriority(classIds: string[]): number {
  let best = Number.POSITIVE_INFINITY;
  for (const classId of classIds) {
    const priority = CLASS_PRIORITY[classId];
    if (priority !== undefined && priority < best) best = priority;
  }
  return best;
}

interface SettlementCandidate {
  entity: WikidataEntity;
  priority: number;
  classIds: string[];
}

function collectSettlementCandidates(entities: WikidataEntity[], cityName: string): SettlementCandidate[] {
  const candidates: SettlementCandidate[] = [];
  for (const entity of entities) {
    const label = entity.labels?.en?.value;
    if (typeof label !== 'string' || !labelMatchesExact(label, cityName)) continue;
    const classIds = (entity.claims?.P31 ?? []).map(statementValueId)
      .filter((classId): classId is string => classId !== null && SETTLEMENT_CLASS_IDS.has(classId));
    if (classIds.length === 0) continue;
    candidates.push({ entity, priority: bestClassPriority(classIds), classIds });
  }
  // Deterministic across search-order shuffles: exact-label settlement
  // classes win in a fixed priority (city/town/commune before metropolis).
  candidates.sort((a, b) => a.priority - b.priority);
  return candidates;
}

function countryHasIso(country: WikidataEntity, isoCode: string, byId: Record<string, WikidataEntity>) {
  const direct = (country.claims?.P297 ?? []).map(statementIsoCode);
  if (direct.includes(isoCode)) return true;
  // Some countries carry the ISO code only on a parent entity
  // (Netherlands Q55 → Kingdom of the Netherlands Q29999 → NL; England-side
  // claims → United Kingdom Q145 → GB), so check one level up as well.
  const parents = (country.claims?.P17 ?? []).map(statementValueId).filter((value): value is string => value !== null);
  return parents.some((parentId) => (byId[parentId]?.claims?.P297 ?? []).map(statementIsoCode).includes(isoCode));
}

function extractPopulation(entity: WikidataEntity): { figure: number; year: number | null } | null {
  const currentYear = new Date().getUTCFullYear();
  const candidates = (entity.claims?.P1082 ?? [])
    .filter((statement) => statement.rank !== 'deprecated')
    .map((statement) => {
      const datavalue = statement.mainsnak?.datavalue?.value;
      const amount = typeof datavalue === 'object' && datavalue !== null ? datavalue.amount : undefined;
      const figure = typeof amount === 'string' ? Number(amount) : Number.NaN;
      const time = statement.qualifiers?.P585?.[0]?.datavalue?.value?.time;
      const yearMatch = typeof time === 'string' ? /^\+(\d{4})-/.exec(time) : null;
      return {
        figure,
        year: yearMatch ? Number(yearMatch[1]) : null,
        preferred: statement.rank === 'preferred' ? 1 : 0,
      };
    })
    .filter((candidate) =>
      Number.isFinite(candidate.figure)
      && candidate.figure > 0
      && candidate.figure <= 200_000_000
      && (candidate.year === null || (candidate.year >= 1800 && candidate.year <= currentYear + 1)));
  if (candidates.length === 0) return null;
  // Prefer the newest point-in-time; ties broken by preferred rank.
  candidates.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || b.preferred - a.preferred);
  return { figure: Math.round(candidates[0].figure), year: candidates[0].year };
}

/**
 * Narrow, hand-verified label aliases for catalog cities whose English label
 * on Wikidata is not identical to the app's city name. Each entry names the
 * exact expected entity — this is allow-listing, not fuzzy matching:
 * - New York → New York City (Q60). The state (Q1384, label "New York") can
 *   never match because its P31 (state, Q35657) is not a settlement class.
 */
const EXPLICIT_LABEL_ALIASES: Record<string, { label: string; iso: string }[]> = {
  'NEW YORK|US': [{ label: 'New York City', iso: 'US' }],
};

/**
 * Exact-label candidates for the requested name, plus any narrowly
 * allow-listed aliases for that name+ISO pair.
 */
function candidateNames(city: City, isoCode: string): string[] {
  const normalized = `${normalizeName(city.name)}|${isoCode}`;
  const aliases = EXPLICIT_LABEL_ALIASES[normalized] ?? [];
  return [city.name, ...aliases.filter((alias) => alias.iso === isoCode).map((alias) => alias.label)];
}

async function resolveCityPopulation(city: City, isoCode: string): Promise<CityPopulation | null> {
  const searchPayload = await fetchWikidataJson(wikidataApi({
    action: 'wbsearchentities', search: city.name, language: 'en', limit: '8',
  })) as { search?: Array<{ id?: string }> };
  const candidateIds = (searchPayload.search ?? [])
    .map((result) => result.id)
    .filter((id): id is string => typeof id === 'string' && /^Q\d+$/.test(id))
    .slice(0, 8);
  if (candidateIds.length === 0) return null;

  const entityPayload = await fetchWikidataJson(wikidataApi({
    action: 'wbgetentities', ids: candidateIds.join('|'), props: 'labels|claims', languages: 'en',
  })) as { entities?: Record<string, WikidataEntity> };
  const entities = Object.values(entityPayload.entities ?? {});

  const names = candidateNames(city, isoCode);
  const settlementCandidates = names.flatMap((name) => collectSettlementCandidates(entities, name));
  if (settlementCandidates.length === 0) return null;

  const countryIds = [...new Set(settlementCandidates.flatMap(({ entity }) =>
    (entity.claims?.P17 ?? []).map(statementValueId).filter((value): value is string => value !== null)))];
  if (countryIds.length === 0) return null;

  const countryPayload = await fetchWikidataJson(wikidataApi({
    action: 'wbgetentities', ids: countryIds.join('|'), props: 'claims', languages: 'en',
  })) as { entities?: Record<string, WikidataEntity> };
  const countryById = countryPayload.entities ?? {};

  for (const { entity } of settlementCandidates) {
    const matchesCountry = (entity.claims?.P17 ?? []).map(statementValueId).filter((value): value is string => value !== null)
      .some((countryId) => countryById[countryId] && countryHasIso(countryById[countryId], isoCode, countryById));
    if (!matchesCountry) continue;
    const population = extractPopulation(entity);
    if (!population) continue;
    const id = entity.id ?? '';
    return {
      figure: population.figure,
      year: population.year,
      sourceUrl: `https://www.wikidata.org/wiki/${id}#P1082`,
      wikidataId: id,
      entityLabel: entity.labels?.en?.value ?? city.name,
    };
  }
  return null;
}

// Shared cache: resolutions are keyed by city name + country ISO, so they
// survive route and city-switch churn. No caller abort signal is threaded
// through because each request is shared across mounts; components guard
// their own state updates after a switch instead.
const populationCache = new Map<string, { value: CityPopulation | null; expiresAt: number }>();
const populationInflight = new Map<string, Promise<CityPopulation | null>>();

export function getCityPopulation(city: City): Promise<CityPopulation | null> {
  const isoCode = city.countryCode.toUpperCase();
  if (!/^[A-Z]{2}$/.test(isoCode)) return Promise.resolve(null);
  const cacheKey = `${normalizeName(city.name)}|${isoCode}`;
  const cached = populationCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.value);
  const inflight = populationInflight.get(cacheKey);
  if (inflight) return inflight;

  const request = resolveCityPopulation(city, isoCode)
    .then((value) => {
      populationCache.set(cacheKey, { value, expiresAt: Date.now() + (value ? CACHE_TTL_MS : FAILURE_CACHE_TTL_MS) });
      return value;
    })
    .catch(() => {
      populationCache.set(cacheKey, { value: null, expiresAt: Date.now() + FAILURE_CACHE_TTL_MS });
      return null;
    })
    .finally(() => populationInflight.delete(cacheKey));
  populationInflight.set(cacheKey, request);
  return request;
}