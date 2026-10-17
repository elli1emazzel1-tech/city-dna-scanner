'use client';

import SimulationWorkspace from './SimulationWorkspace';
import { useCitySelection } from '../dashboard/CitySelectionProvider';
import { useCityEnvironmentalData } from '../dashboard/useCityEnvironmentalData';

export default function SimulationPage() {
  const { city, setCity } = useCitySelection();
  const { data, isLoading, isGreenLoading } = useCityEnvironmentalData(city);

  return (
    <SimulationWorkspace
      data={data}
      onSelectCity={setCity}
      dataStatus={isLoading ? 'LOADING DATA' : 'PARTIAL DATA'}
      isLoading={isLoading || isGreenLoading}
    />
  );
}
