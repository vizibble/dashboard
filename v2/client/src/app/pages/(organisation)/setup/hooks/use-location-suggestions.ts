import { useEffect, useRef, useState } from 'react';

import { searchLocations } from '@/app/pages/(organisation)/setup/api';
import type { LocationSuggestion } from '@/app/pages/(organisation)/setup/types';

const SEARCH_DELAY_MS = 300;

/** Debounced location suggestions for the text being typed, plus the open/active-option state of the list. */
export function useLocationSuggestions(value: string, onChange: (value: string) => void) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);

  const [open, setOpen] = useState(false);

  const [loading, setLoading] = useState(false);

  const [activeIndex, setActiveIndex] = useState(-1);

  const selectedLocationRef = useRef<string | null>(null);

  useEffect(() => {
    const query = value.trim();

    // Do not search again immediately after selecting a suggestion.
    if (selectedLocationRef.current === query) {
      selectedLocationRef.current = null;

      return;
    }
    if (query.length < 2) {
      return;
    }
    const controller = new AbortController();

    async function search() {
      setLoading(true);
      try {
        const results = await searchLocations(query, controller.signal);

        if (controller.signal.aborted) {
          return;
        }
        setSuggestions(results);
        setOpen(results.length > 0);
        setActiveIndex(-1);
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([]);
          setOpen(false);
          setActiveIndex(-1);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    const timeout = window.setTimeout(() => {
      void search();
    }, SEARCH_DELAY_MS);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [value]);

  function selectLocation(location: string) {
    selectedLocationRef.current = location;
    onChange(location);
    setSuggestions([]);
    setOpen(false);
    setLoading(false);
    setActiveIndex(-1);
  }

  function changeQuery(newValue: string) {
    selectedLocationRef.current = null;
    onChange(newValue);
    if (newValue.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      setActiveIndex(-1);

      return;
    }
    setOpen(true);
  }

  return { suggestions, open, setOpen, loading, activeIndex, setActiveIndex, selectLocation, changeQuery };
}
