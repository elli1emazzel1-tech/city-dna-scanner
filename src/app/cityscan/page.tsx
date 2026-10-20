'use client';

import DashboardShell from '@/components/dashboard/DashboardShell';
import { useCitySelection } from '@/components/dashboard/CitySelectionProvider';
import CityScanPage from '@/components/cityscan/CityScanPage';

/**
 * City Scan lives inside the shared Enrealys shell (header, city search,
 * navigation, sign-in control) like every other dashboard page — no separate
 * layout or duplicated navigation. Browsing is public; sign-in stays optional
 * in the header and is only required for operations that trigger scans.
 */
export default function CityScanRoute() {
  const { city, setCity } = useCitySelection();
  return (
    <DashboardShell city={city} onSelectCity={setCity} dataStatus="SENTINEL-2 L2A">
      <CityScanPage />
    </DashboardShell>
  );
}
