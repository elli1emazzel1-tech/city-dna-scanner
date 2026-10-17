export type DataStatus = 'OBSERVED' | 'FORECAST' | 'HISTORICAL' | 'MODELLED' | 'SIMULATED' | 'REPORTED' | 'CACHED' | 'CONNECTED' | 'ERROR' | 'UNAVAILABLE';
export type MetricCondition =
  | 'Good'
  | 'Moderate'
  | 'Unhealthy for sensitive groups'
  | 'Unhealthy'
  | 'Very unhealthy'
  | 'Hazardous'
  | 'High'
  | 'Elevated'
  | 'Stable'
  | 'Informational'
  | 'Unavailable';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface City {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  coordinates: Coordinates;
}

export interface EnvironmentalMetric {
  id: 'air' | 'water' | 'green' | 'carbon' | 'noise' | 'flood';
  label: string;
  value: string;
  unit: string;
  subValue: string;
  condition: MetricCondition;
  status: DataStatus;
  source: string;
  updated: string | null;
  error?: string;
}

export interface OpenWeatherCityResult {
  city: City;
  airQuality: EnvironmentalMetric;
}

export interface WeatherData {
  temperature: number | null;
  apparentTemperature?: number | null;
  soilMoisture?: number | null;
  humidity: number | null;
  windSpeed: number | null;
  condition: string | null;
  status: DataStatus;
  source: string;
  updated: string | null;
  /** IANA timezone of the city, from the provider (`timezone=auto`). Used for the local-time clock. */
  timezone?: string | null;
  error?: string;
}

export interface CityEnvironmentalData {
  city: City;
  weather: WeatherData;
  metrics: EnvironmentalMetric[];
  healthScore: null;
}

export type MapLayerId =
  | 'heat'
  | 'flood'
  | 'air'
  | 'green'
  | 'hazards'
  | 'buildings'
  | 'roads'
  | 'water';

export interface MapLayer {
  id: MapLayerId;
  label: string;
  enabled: boolean;
  status: DataStatus;
}

export interface SimulationScenario {
  treeCanopyIncrease: number;
  coolRoofAdoption: number;
  drainageCapacityIncrease: number;
}

export interface HistoricalTemperaturePoint {
  date: string;
  temperature: number;
}
