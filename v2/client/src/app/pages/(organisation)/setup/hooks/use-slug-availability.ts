import { useEffect, useState } from 'react';

import { checkSlugAvailability } from '@/app/pages/(organisation)/setup/api';
import { isCheckableSlug } from '@/app/pages/(organisation)/setup/lib/organisation-slug';

export type SlugAvailabilityStatus = 'checking' | 'available' | 'taken' | 'error';

type SlugAvailability = { slug: string; status: SlugAvailabilityStatus };

const CHECK_DELAY_MS = 450;

/** Debounced availability check for the slug being typed. Status is null when it no longer applies. */
export function useSlugAvailability(slug: string) {
  const [availability, setAvailability] = useState<SlugAvailability | null>(null);

  useEffect(() => {
    if (!isCheckableSlug(slug)) {
      return;
    }
    let active = true;

    async function check() {
      try {
        const available = await checkSlugAvailability(slug);

        if (!active) {
          return;
        }
        setAvailability({ slug, status: available ? 'available' : 'taken' });
      } catch {
        if (!active) {
          return;
        }
        setAvailability({ slug, status: 'error' });
      }
    }

    const timeout = window.setTimeout(() => {
      setAvailability({ slug, status: 'checking' });
      void check();
    }, CHECK_DELAY_MS);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [slug]);

  const status = availability?.slug === slug ? availability.status : null;

  return {
    status,
    markTaken: (takenSlug: string) => setAvailability({ slug: takenSlug, status: 'taken' }),
  };
}
