'use client';

import { useSyncExternalStore } from 'react';
import type { SavedScenario } from '../../lib/data/simulation';

/**
 * Local-only persistence for saved scenarios.
 *
 * There is no backend, so scenarios persist in browser localStorage. This MUST be
 * labelled local-only in the UI (see SavedScenarios / ScenarioComparison).
 */

const STORAGE_KEY = 'city-dna-simulation-scenarios-v1';

interface ScenariosSnapshot {
  scenarios: SavedScenario[];
  error: string;
}

const EMPTY: ScenariosSnapshot = { scenarios: [], error: '' };
const EMPTY_FROZEN: SavedScenario[] = [];
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedSnapshot: ScenariosSnapshot = EMPTY;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSavedScenario(value: unknown): value is SavedScenario {
  if (!isRecord(value)) return false;
  const s = value as Record<string, unknown>;
  return typeof s.id === 'string'
    && typeof s.cityId === 'string'
    && typeof s.cityName === 'string'
    && typeof s.goalId === 'string'
    && isRecord(s.coordinates)
    && typeof (s.coordinates as Record<string, unknown>).latitude === 'number'
    && typeof (s.coordinates as Record<string, unknown>).longitude === 'number'
    && isRecord(s.assumptions)
    && Array.isArray(s.baseline)
    && Array.isArray(s.projected)
    && typeof s.targetYear === 'number'
    && typeof s.modelVersion === 'string'
    && typeof s.createdAt === 'string'
    && Number.isFinite(Date.parse(s.createdAt));
}

function getSnapshot(): ScenariosSnapshot {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedSnapshot;
    cachedRaw = raw;
    if (!raw) {
      cachedSnapshot = EMPTY;
      return cachedSnapshot;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('Saved scenarios have an invalid format.');
    const scenarios = parsed.filter(isSavedScenario);
    cachedSnapshot = {
      scenarios,
      error: scenarios.length === parsed.length
        ? ''
        : 'Some saved scenarios could not be read because their stored data is invalid.',
    };
    return cachedSnapshot;
  } catch (error) {
    console.error('Could not load saved scenarios.', error);
    cachedSnapshot = { scenarios: EMPTY_FROZEN, error: 'Saved scenarios could not be loaded from this browser.' };
    return cachedSnapshot;
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

function emit() {
  for (const listener of listeners) listener();
}

export function storeScenario(scenario: SavedScenario): boolean {
  try {
    const current = getSnapshot().scenarios;
    const next = [scenario, ...current.filter((item) => item.id !== scenario.id)];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    cachedRaw = window.localStorage.getItem(STORAGE_KEY);
    emit();
    return true;
  } catch (error) {
    console.error('Could not save scenario.', error);
    return false;
  }
}

export function removeScenario(id: string): boolean {
  try {
    const next = getSnapshot().scenarios.filter((scenario) => scenario.id !== id);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    cachedRaw = window.localStorage.getItem(STORAGE_KEY);
    emit();
    return true;
  } catch (error) {
    console.error('Could not remove scenario.', error);
    return false;
  }
}

export function useScenarios() {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}
