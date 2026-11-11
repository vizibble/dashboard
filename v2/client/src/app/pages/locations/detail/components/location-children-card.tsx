import { CaretRightIcon, MagnifyingGlassIcon, PlusIcon } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { CustomContainerIcon, CustomTerminalIcon } from '@/app/pages/locations/detail/components/location-icons';
import { useLocationActions } from '@/app/pages/locations/shared/hooks/use-location-actions';
import type { Location } from '@/app/pages/locations/shared/types';
import { Button } from '@/app/shared/components/ui/button';
import { Input } from '@/app/shared/components/ui/input';

interface LocationChildrenSectionProps {
  location: Location;
  childrenLocations: Location[];
}

export function LocationChildrenSection({ location, childrenLocations }: LocationChildrenSectionProps) {
  const { openCreate, can } = useLocationActions();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Show search field only when list is long (>= 6 items)
  const showSearch = childrenLocations.length >= 6;

  const filteredChildren = useMemo(() => {
    if (!showSearch || !searchQuery.trim()) {
      return childrenLocations;
    }
    const query = searchQuery.toLowerCase().trim();
    return childrenLocations.filter((child) => child.name.toLowerCase().includes(query));
  }, [childrenLocations, searchQuery, showSearch]);

  return (
    <section aria-labelledby="sublocations-heading" className="space-y-4">
      {/* Section Header (count label removed) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="sublocations-heading" className="text-foreground text-sm font-semibold tracking-tight">
          Sub-locations
        </h2>

        {showSearch && (
          <div className="relative w-full sm:w-64">
            <MagnifyingGlassIcon
              size={14}
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Search sub-locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs"
              aria-label="Filter sub-locations"
            />
          </div>
        )}
      </div>

      {/* Content: Empty state or clean row list */}
      {childrenLocations.length === 0 ? (
        <div className="border-border/70 bg-card rounded-lg border border-dashed p-8 text-center shadow-xs">
          <div className="border-border/60 bg-muted/40 text-muted-foreground mx-auto mb-3 flex size-10 items-center justify-center rounded-lg border">
            <CustomContainerIcon size={22} weight="duotone" className="text-primary" />
          </div>
          <p className="text-foreground text-sm font-medium">No sub-locations configured</p>
          <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-xs leading-relaxed">
            Add child areas, rooms, or zones to organize equipment within this container.
          </p>
          {can.create && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => openCreate(location.id)}
              className="mt-4 h-8 gap-1.5 px-3 text-xs"
            >
              <PlusIcon size={14} weight="bold" aria-hidden="true" />
              <span>Add sub-location</span>
            </Button>
          )}
        </div>
      ) : filteredChildren.length === 0 ? (
        <div className="border-border/70 bg-card rounded-lg border p-6 text-center shadow-xs">
          <p className="text-foreground text-xs font-medium">No sub-locations match &quot;{searchQuery}&quot;</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery('')}
            className="text-muted-foreground hover:text-foreground mt-2 h-7 text-xs"
          >
            Clear filter
          </Button>
        </div>
      ) : (
        <div className="border-border/70 bg-card divide-border/60 divide-y overflow-hidden rounded-lg border shadow-xs">
          {filteredChildren.map((child) => (
            <div
              key={child.id}
              role="button"
              tabIndex={0}
              onClick={() => void navigate(`/locations/${child.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  void navigate(`/locations/${child.id}`);
                }
              }}
              className="hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-ring flex cursor-pointer items-center justify-between gap-4 px-4 py-3 transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
              aria-label={`View ${child.name}`}
            >
              {/* Left: Custom Icon, Name & dynamic descriptive subtitle */}
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="border-border/60 bg-muted/40 text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-md border"
                  aria-hidden="true"
                >
                  {child.can_have_children ? (
                    <CustomContainerIcon size={18} weight="duotone" className="text-primary" />
                  ) : (
                    <CustomTerminalIcon size={18} weight="duotone" className="text-primary" />
                  )}
                </span>
                <div className="min-w-0">
                  <span className="text-foreground block truncate text-sm font-medium">{child.name}</span>
                  <span className="text-muted-foreground block text-xs">
                    {child.can_have_children ? 'Container space' : 'Terminal space (device-ready)'}
                  </span>
                </div>
              </div>

              {/* Right: Chevron (badges removed) */}
              <div className="flex shrink-0 items-center">
                <CaretRightIcon size={15} className="text-muted-foreground/70" aria-hidden="true" />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
