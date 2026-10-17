'use client';

import OverviewDashboard from './OverviewDashboard';
import { useCitySelection } from './CitySelectionProvider';
import { useCityEnvironmentalData } from './useCityEnvironmentalData';

export default function ProfessionalDashboard() {
  const { city, setCity } = useCitySelection();
  const { data, isLoading, isGreenLoading } = useCityEnvironmentalData(city);

  return (
    <OverviewDashboard
      data={data}
      dataStatus={isLoading ? 'LOADING DATA' : 'PARTIAL DATA'}
      isLoading={isLoading}
      isGreenLoading={isGreenLoading}
      onSelectCity={setCity}
    />
  );
}
