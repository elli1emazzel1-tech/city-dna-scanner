'use client';

import { createContext, useCallback, useContext, useSyncExternalStore } from 'react';
import { getOrganisationById, organisations, type Organisation } from '../../lib/data/workspace';

interface WorkspaceValue {
  organisations: Organisation[];
  organisation: Organisation;
  activeOrgId: string;
  setActiveOrganisation: (id: string) => boolean;
}

const WorkspaceContext = createContext<WorkspaceValue | null>(null);
const STORAGE_KEY = 'city-dna-active-organisation-v1';
const CHANGE_EVENT = 'city-dna-active-organisation-change';

function getActiveOrgIdSnapshot(): string {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && organisations.some((organisation) => organisation.id === stored)) return stored;
  } catch (error) {
    console.error('Could not load the active organisation.', error);
  }
  return organisations[0].id;
}

function subscribe(listener: () => void) {
  window.addEventListener('storage', listener);
  window.addEventListener(CHANGE_EVENT, listener);
  return () => {
    window.removeEventListener('storage', listener);
    window.removeEventListener(CHANGE_EVENT, listener);
  };
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const activeOrgId = useSyncExternalStore(subscribe, getActiveOrgIdSnapshot, () => organisations[0].id);

  const setActiveOrganisation = useCallback((id: string) => {
    if (!organisations.some((organisation) => organisation.id === id)) return false;
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
      window.dispatchEvent(new Event(CHANGE_EVENT));
      return true;
    } catch (error) {
      console.error('Could not save the active organisation.', error);
      return false;
    }
  }, []);

  const organisation = getOrganisationById(activeOrgId) ?? organisations[0];

  return (
    <WorkspaceContext.Provider value={{ organisations, organisation, activeOrgId: organisation.id, setActiveOrganisation }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used inside WorkspaceProvider.');
  return context;
}
