import { authClient, unwrap } from '@/app/pages/(auth)/client';
import type { OrganisationFormValues } from '@/app/pages/(organisation)/setup/schemas/organisation-setup-schema';
import type { LocationSuggestion, PhotonFeature } from '@/app/pages/(organisation)/setup/types';

/** Whether a slug is free. A taken slug is an expected answer, not a failure. */
export async function checkSlugAvailability(slug: string): Promise<boolean> {
  const result = await authClient.organization.checkSlug({ slug });

  if (!result.error) {
    return result.data.status;
  }
  if (result.error.code === 'ORGANIZATION_SLUG_ALREADY_TAKEN') {
    return false;
  }
  throw new Error('Could not check organisation URL.');
}

type CreateOrganisationInput = { name: string; slug: string; metadata?: { location: string } };

export function createOrganisation(values: OrganisationFormValues, slug: string) {
  const input: CreateOrganisationInput = { name: values.name.trim(), slug };

  const location = values.location.trim();

  if (location) {
    input.metadata = { location };
  }

  return unwrap(authClient.organization.create(input), 'Could not create the organisation.');
}

/** Place suggestions for a free-text location query, de-duplicated by their full label. */
export async function searchLocations(query: string, signal: AbortSignal): Promise<LocationSuggestion[]> {
  // Photon is a third-party geocoder, not the Vizibble API, so it is called directly rather than via `api`.
  const params = new URLSearchParams({ q: query, limit: '5', lang: 'en' });

  const response = await fetch(`https://photon.komoot.io/api/?${params.toString()}`, { signal });

  if (!response.ok) {
    throw new Error(`Location search failed with status ${response.status}.`);
  }
  const data = (await response.json()) as { features?: PhotonFeature[] };

  return (data.features ?? [])
    .map(({ properties = {} }) => {
      const name = properties.name || properties.city || '';

      const detail = [
        properties.city !== name ? properties.city : undefined,
        properties.state,
        properties.country,
      ]
        .filter(Boolean)
        .join(', ');

      return {
        name,
        detail,
        full: [name, detail].filter(Boolean).join(', '),
      };
    })
    .filter((item) => item.full)
    .filter((item, index, all) => all.findIndex((other) => other.full === item.full) === index);
}
