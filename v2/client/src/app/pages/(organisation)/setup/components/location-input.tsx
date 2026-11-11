import { MapPinIcon } from '@phosphor-icons/react';
import axios from 'axios';
import { useEffect, useId, useRef, useState } from 'react';

import type { LocationInputProps, LocationSuggestion, PhotonFeature } from '@/app/pages/(organisation)/setup/types';
import { cn } from '@/app/shared/utils/cn';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

export function LocationInput({ id, value, onChange, disabled = false, hasError = false }: LocationInputProps) {
  const generatedId = useId();
  const inputId = id ?? `location-${generatedId}`;
  const listId = `${inputId}-suggestions`;

  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const listRef = useRef<HTMLUListElement>(null);
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
    async function searchLocations() {
      setLoading(true);
      try {
        const response = await axios.get<{ features?: PhotonFeature[] }>('https://photon.komoot.io/api/', {
          params: {
            q: query,
            limit: 5,
            lang: 'en',
          },
          signal: controller.signal,
        });
        if (controller.signal.aborted) {
          return;
        }
        const results = (response.data.features ?? [])
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
        setSuggestions(results);
        setOpen(results.length > 0);
        setActiveIndex(-1);
      } catch (error) {
        if (!controller.signal.aborted && !axios.isCancel(error)) {
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
      void searchLocations();
    }, 300);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [value]);

  // Scroll only the suggestions list when navigating with the keyboard.
  useEffect(() => {
    if (!open || activeIndex < 0) {
      return;
    }
    const list = listRef.current;
    const option = list?.children.item(activeIndex) as HTMLElement | null;
    if (!list || !option) {
      return;
    }
    const listRect = list.getBoundingClientRect();
    const optionRect = option.getBoundingClientRect();
    if (optionRect.bottom > listRect.bottom) {
      list.scrollTop += optionRect.bottom - listRect.bottom;
    } else if (optionRect.top < listRect.top) {
      list.scrollTop -= listRect.top - optionRect.top;
    }
  }, [activeIndex, open, suggestions]);

  function selectLocation(location: string) {
    selectedLocationRef.current = location;
    onChange(location);
    setSuggestions([]);
    setOpen(false);
    setLoading(false);
    setActiveIndex(-1);
  }

  function handleChange(newValue: string) {
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

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (!open || suggestions.length === 0) {
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      const selected = suggestions[activeIndex];
      if (selected) {
        selectLocation(selected.full);
      }
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <Input
          id={inputId}
          value={value}
          disabled={disabled}
          placeholder="Search city, state or country"
          autoComplete="off"
          aria-invalid={hasError}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined}
          onChange={(event) => handleChange(event.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) {
              setOpen(true);
            }
          }}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 120);
          }}
          onKeyDown={handleKeyDown}
          className="h-11 pr-10"
        />
        {loading && (
          <Spinner
            aria-label="Searching locations"
            className="text-muted-foreground absolute top-3 right-3 size-4 animate-spin"
          />
        )}
      </div>
      {open && suggestions.length > 0 && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="Location suggestions"
          className="border-border bg-popover text-popover-foreground absolute inset-x-0 top-full z-50 mt-1 max-h-56 overflow-y-auto overscroll-contain rounded-md border p-1 shadow-md"
        >
          {suggestions.map((item, index) => (
            <li key={item.full} role="presentation">
              <button
                id={`${listId}-option-${index}`}
                type="button"
                role="option"
                aria-selected={activeIndex === index}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectLocation(item.full)}
                className={cn(
                  'flex w-full cursor-pointer items-start gap-2 rounded-sm px-2.5 py-2 text-left text-sm',
                  activeIndex === index ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50',
                )}
              >
                <MapPinIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{item.name}</span>
                  {item.detail && <span className="text-muted-foreground block truncate text-xs">{item.detail}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
