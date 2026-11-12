import type { OrganisationContextValue, OrganisationSummary } from '@/app/pages/(organisation)/types';
import { createContext, useContext } from 'react';

export type { OrganisationContextValue, OrganisationSummary };

export const organisationContext = createContext<OrganisationContextValue | null>(null);

export function useOrganisationContext(): OrganisationContextValue {
  const context = useContext(organisationContext);

  if (!context) {
    throw new Error('useOrganisationContext must be used within RequireOrganisation.');
  }

  return context;
}
