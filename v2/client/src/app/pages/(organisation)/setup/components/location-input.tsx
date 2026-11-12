import { MapPinIcon } from '@phosphor-icons/react';
import { useEffect, useId, useRef } from 'react';

import { useLocationSuggestions } from '@/app/pages/(organisation)/setup/hooks/use-location-suggestions';
import type { LocationInputProps } from '@/app/pages/(organisation)/setup/types';
import { cn } from '@/app/shared/utils/cn';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

export function LocationInput({
  id,
  value,
  onChange,
  disabled = false,
  hasError = false,
}: LocationInputProps) {
  const generatedId = useId();

  const inputId = id ?? `location-${generatedId}`;

  const listId = `${inputId}-suggestions`;

  const { suggestions, open, setOpen, loading, activeIndex, setActiveIndex, selectLocation, changeQuery } =
    useLocationSuggestions(value, onChange);

  const listRef = useRef<HTMLUListElement>(null);

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
          onChange={(event) => changeQuery(event.target.value)}
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
                  {item.detail && (
                    <span className="text-muted-foreground block truncate text-xs">{item.detail}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
