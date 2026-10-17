'use client';

import { createContext, useCallback, useContext, useState, useSyncExternalStore } from 'react';
import { cities } from '../../lib/data/cities';
import type { City, EnvironmentalMetric } from '../../lib/data/types';

interface CitySelectionValue {
  city: City;
  setCity: (city: City, airQuality?: EnvironmentalMetric) => void;
  airQualityOverride: { cityId: string; latitude: number; longitude: number; metric: EnvironmentalMetric } | null;
  measurementSystem: 'Metric' | 'Imperial';
  setMeasurementSystem: (system: 'Metric' | 'Imperial') => boolean;
}

const CitySelectionContext = createContext<CitySelectionValue | null>(null);
const measurementStorageKey = 'city-dna-measurement-system-v1';
const measurementChangeEvent = 'city-dna-measurement-system-change';

function getMeasurementSystemSnapshot(): 'Metric' | 'Imperial' {
  try {
    return window.localStorage.getItem(measurementStorageKey) === 'Imperial' ? 'Imperial' : 'Metric';
  } catch (error) {
    console.error('Could not load the measurement preference.', error);
    return 'Metric';
  }
}

function subscribeToMeasurementSystem(listener: () => void) {
  window.addEventListener('storage', listener);
  window.addEventListener(measurementChangeEvent, listener);
  return () => {
    window.removeEventListener('storage', listener);
    window.removeEventListener(measurementChangeEvent, listener);
  };
}

export function CitySelectionProvider({ children }: { children: React.ReactNode }) {
  const defaultCity = cities.find((item) => item.id === 'mumbai') ?? cities[0];
  const [selection, setSelection] = useState<{
    city: City;
    airQualityOverride: CitySelectionValue['airQualityOverride'];
  }>({ city: defaultCity, airQualityOverride: null });
  const { city, airQualityOverride } = selection;
  const measurementSystem = useSyncExternalStore(subscribeToMeasurementSystem, getMeasurementSystemSnapshot, (): 'Metric' => 'Metric');

  const selectCity = useCallback((nextCity: City, airQuality?: EnvironmentalMetric) => {
    setSelection((current) => {
      const sameCity = current.city.id === nextCity.id
        && current.city.coordinates.latitude === nextCity.coordinates.latitude
        && current.city.coordinates.longitude === nextCity.coordinates.longitude;
      if (sameCity && !airQuality) return current;
      return {
        city: sameCity ? current.city : nextCity,
        airQualityOverride: airQuality
          ? {
              cityId: nextCity.id,
              latitude: nextCity.coordinates.latitude,
              longitude: nextCity.coordinates.longitude,
              metric: airQuality,
            }
          : null,
      };
    });
  }, []);

  const setMeasurementSystem = useCallback((system: 'Metric' | 'Imperial') => {
    try {
      window.localStorage.setItem(measurementStorageKey, system);
      window.dispatchEvent(new Event(measurementChangeEvent));
      return true;
    } catch (error) {
      console.error('Could not save the measurement preference.', error);
      return false;
    }
  }, []);

  return (
    <CitySelectionContext.Provider value={{ city, setCity: selectCity, airQualityOverride, measurementSystem, setMeasurementSystem }}>
      {children}
    </CitySelectionContext.Provider>
  );
}

export function useCitySelection() {
  const context = useContext(CitySelectionContext);
  if (!context) throw new Error('useCitySelection must be used inside CitySelectionProvider.');
  return context;
}
