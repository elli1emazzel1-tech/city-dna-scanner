'use client';

import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, MapPin, Search } from 'lucide-react';
import { searchKnownCities } from '../../lib/data/cities';
import { openMeteoGeospatialProvider } from '../../lib/data/providers';
import type { City } from '../../lib/data/types';

interface CitySearchProps {
  selectedCity: City;
  onSelect: (city: City) => void;
}

export default function CitySearch({ selectedCity, onSelect }: CitySearchProps) {
  const [query, setQuery] = useState('');
  const [remoteResults, setRemoteResults] = useState<{ query: string; cities: City[] }>({ query: '', cities: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const requestRef = useRef<AbortController | null>(null);
  const knownSuggestions = searchKnownCities(query);
  const remoteSuggestions = remoteResults.query === query ? remoteResults.cities : [];
  const suggestions = Array.from(new Map(
    [...remoteSuggestions, ...knownSuggestions].map((city) => [`${city.name.toLocaleLowerCase()}-${city.countryCode}`, city]),
  ).values()).slice(0, 7);

  useEffect(() => {
    if (query.trim().length < 2) return;

    const controller = new AbortController();
    requestRef.current = controller;
    const timer = window.setTimeout(() => {
      openMeteoGeospatialProvider.searchCities(query, controller.signal)
        .then((results) => {
          if (controller.signal.aborted) return;
          setRemoteResults({ query, cities: results });
          setSearchError('');
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          console.error('City search could not reach the geocoding provider.', error);
          setSearchError('Online city lookup is temporarily unavailable. Choose a listed city or try again.');
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsSearching(false);
        });
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
      if (requestRef.current === controller) requestRef.current = null;
    };
  }, [query]);

  const resolveCity = async (query: string, controller: AbortController) => {
    try {
      const cities = await openMeteoGeospatialProvider.searchCities(query, controller.signal);
      if (controller.signal.aborted) return;
      const city = cities[0];
      if (!city) {
        setSearchError('City was not recognized. Check the spelling and try again.');
        return;
      }
      onSelect(city);
      setQuery('');
      setSearchError('');
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error('Open-Meteo city geocoding failed.', error);
      setSearchError('City lookup is temporarily unavailable. Please retry.');
    } finally {
      if (!controller.signal.aborted) {
        requestRef.current = null;
        setIsSearching(false);
      }
    }
  };

  const selectCity = (city: City) => {
    requestRef.current?.abort();
    setIsSearching(true);
    setSearchError('');
    onSelect(city);
    setQuery('');
    requestRef.current = null;
    setIsSearching(false);
  };

  const submitSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (query.trim().length < 2) return;

    setIsSearching(true);
    const controller = new AbortController();
    requestRef.current?.abort();
    requestRef.current = controller;
    await resolveCity(query.trim(), controller);
  };

  return (
    <div className="relative w-full max-w-[460px]">
      <form onSubmit={submitSearch} role="search">
        <label className="sr-only" htmlFor="global-city-search">Search for a city</label>
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          id="global-city-search"
          value={query}
          onChange={(event) => {
            requestRef.current?.abort();
            requestRef.current = null;
            setQuery(event.target.value);
            setIsSearching(event.target.value.trim().length >= 2);
            setSearchError('');
          }}
          maxLength={120}
          placeholder={`Search any city · current ${selectedCity.name}`}
          autoComplete="off"
          aria-describedby={searchError ? 'city-search-message' : undefined}
          className="h-10 w-full rounded-md border border-[#1c3042] bg-[#071523] pl-10 pr-10 text-xs text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/10"
        />
        {isSearching && <LoaderCircle size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-teal-300" />}
      </form>

      {(suggestions.length > 0 || searchError) && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[1100] overflow-hidden rounded-md border border-[#24384a] bg-[#071523] shadow-2xl">
          {suggestions.map((city) => (
            <button key={city.id} type="button" onClick={() => selectCity(city)} className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-teal-400/10">
              <MapPin size={14} className="text-teal-300" />
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium text-slate-100">{city.name}</span>
                <span className="block truncate text-[10px] text-slate-500">{city.country}</span>
              </span>
              <span className="ml-auto font-mono text-[9px] text-slate-600">{city.countryCode}</span>
            </button>
          ))}
          {searchError && <p id="city-search-message" role="alert" className="border-t border-slate-800 px-3.5 py-2 text-[10px] text-amber-300">{searchError}</p>}
          {!searchError && suggestions.length === 0 && !isSearching && (
            <p className="px-3.5 py-3 text-[11px] text-slate-400">No matching city. Try a different name.</p>
          )}
        </div>
      )}
    </div>
  );
}
