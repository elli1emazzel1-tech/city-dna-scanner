'use client';

import { useEffect, useState } from 'react';
import { getCityEnvironmentalDataById, openStreetMapGreenSpaceProvider } from '../../lib/data/providers';
import { createUnavailableCityData, createUnavailableMetric } from '../../lib/data/metrics';
import type { City, CityEnvironmentalData } from '../../lib/data/types';
import { useCitySelection } from './CitySelectionProvider';

export function useCityEnvironmentalData(city: City) {
  const { airQualityOverride } = useCitySelection();
  const [result, setResult] = useState<{
    cityId: string;
    data: CityEnvironmentalData;
    baseLoaded: boolean;
    greenLoading: boolean;
  } | null>(null);
  const hasCurrentData = result?.cityId === city.id;

  useEffect(() => {
    const controller = new AbortController();
    getCityEnvironmentalDataById(city, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setResult((previous) => {
          const sameCity = previous?.cityId === city.id;
          const green = sameCity ? previous.data.metrics.find((metric) => metric.id === 'green') : undefined;
          const infrastructure = sameCity ? previous.data.metrics.find((metric) => metric.id === 'noise') : undefined;
          return {
            cityId: city.id,
            data: green
              ? { ...data, metrics: data.metrics.map((metric) => (
                metric.id === 'green' ? green : metric.id === 'noise' ? infrastructure ?? metric : metric
              )) }
              : data,
            baseLoaded: true,
            greenLoading: sameCity ? previous.greenLoading : true,
          };
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error(`Could not load environmental data for ${city.name}.`, error);
        const message = error instanceof Error ? error.message : 'Environmental data provider request failed.';
        const data = createUnavailableCityData(city);
        setResult((previous) => {
          const sameCity = previous?.cityId === city.id;
          const green = sameCity ? previous.data.metrics.find((metric) => metric.id === 'green') : undefined;
          const infrastructure = sameCity ? previous.data.metrics.find((metric) => metric.id === 'noise') : undefined;
          return {
            cityId: city.id,
            data: {
              ...data,
              weather: { ...data.weather, error: message },
              metrics: data.metrics.map((metric) => {
                if (metric.id === 'air') return { ...metric, status: 'ERROR' as const, error: message, subValue: message };
                if (metric.id === 'green' && green) return green;
                return metric.id === 'noise' && infrastructure ? infrastructure : metric;
              }),
            },
            baseLoaded: true,
            greenLoading: sameCity ? previous.greenLoading : true,
          };
        });
      });

    openStreetMapGreenSpaceProvider.getMappedCityFeatures(city.coordinates, controller.signal)
      .then(({ vegetation, infrastructure }) => {
        if (controller.signal.aborted) return;
        setResult((previous) => {
          const data = previous?.cityId === city.id ? previous.data : createUnavailableCityData(city);
          return {
            cityId: city.id,
            data: {
              ...data,
              metrics: data.metrics.map((metric) => (
                metric.id === 'green' ? vegetation : metric.id === 'noise' ? infrastructure : metric
              )),
            },
            baseLoaded: previous?.cityId === city.id && previous.baseLoaded,
            greenLoading: false,
          };
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error(`Could not load mapped OpenStreetMap features for ${city.name}.`, error);
        const message = error instanceof Error ? error.message : 'OpenStreetMap vegetation lookup failed.';
        setResult((previous) => {
          const data = previous?.cityId === city.id ? previous.data : createUnavailableCityData(city);
          return {
            cityId: city.id,
            data: {
              ...data,
              metrics: data.metrics.map((metric) => {
                if (metric.id !== 'green' && metric.id !== 'noise') return metric;
                const unavailable = createUnavailableMetric(metric.id, message);
                return { ...unavailable, source: 'OpenStreetMap · Overpass API' };
              }),
            },
            baseLoaded: previous?.cityId === city.id && previous.baseLoaded,
            greenLoading: false,
          };
        });
      });
    return () => controller.abort();
  }, [city]);

  const cityData = hasCurrentData ? result.data : createUnavailableCityData(city);
  const hasAirOverride = airQualityOverride?.cityId === city.id
    && airQualityOverride.latitude === city.coordinates.latitude
    && airQualityOverride.longitude === city.coordinates.longitude;
  const data = hasAirOverride
    ? {
        ...cityData,
        metrics: cityData.metrics.map((metric) => metric.id === 'air' ? airQualityOverride.metric : metric),
      }
    : cityData;

  return {
    data,
    isLoading: !hasCurrentData || !result.baseLoaded,
    isGreenLoading: !hasCurrentData || result.greenLoading,
  };
}
