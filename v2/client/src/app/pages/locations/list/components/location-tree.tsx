import { CaretDownIcon, CaretRightIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { LocationItemActions } from '@/app/pages/locations/list/components/location-actions-dropdown';
import type { LocationTreeNode } from '@/app/pages/locations/shared/lib/build-location-tree';

interface LocationTreeProps {
  nodes: LocationTreeNode[];
}

export function LocationTree({ nodes }: LocationTreeProps) {
  // Keep track of collapsed nodes (all expanded by default)
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  const toggleCollapse = (id: string) => {
    setCollapsedNodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const renderNodes = (items: LocationTreeNode[], level: number) =>
    items.map(({ location, children }) => {
      const hasChildren = children.length > 0;
      const isCollapsed = Boolean(collapsedNodes[location.id]);
      return (
        <li
          key={location.id}
          role="treeitem"
          aria-selected={false}
          aria-expanded={hasChildren ? !isCollapsed : undefined}
          aria-level={level}
          aria-label={location.name}
          className="relative list-none"
        >
          <div className="group hover:bg-muted/50 focus-within:bg-muted/50 flex min-h-10 items-center gap-1.5 px-2 py-1 transition-colors">
            {/* Toggle chevron or leaf indent placeholder */}
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleCollapse(location.id)}
                className="text-muted-foreground hover:text-foreground hover:bg-muted flex size-7 shrink-0 items-center justify-center rounded-md transition-colors"
                aria-label={isCollapsed ? `Expand ${location.name}` : `Collapse ${location.name}`}
              >
                {isCollapsed ? (
                  <CaretRightIcon size={14} weight="bold" aria-hidden="true" />
                ) : (
                  <CaretDownIcon size={14} weight="bold" aria-hidden="true" />
                )}
              </button>
            ) : (
              <span className="bg-foreground mr-1 flex size-2 shrink-0 items-center justify-center rounded-full opacity-20" />
            )}

            {/* Link to Location */}
            <Link
              to={`/locations/${location.id}`}
              className="text-foreground hover:text-primary min-w-0 flex-1 truncate text-sm font-medium transition-colors focus-visible:underline focus-visible:outline-none"
            >
              {location.name}
            </Link>

            {/* Context Actions */}
            <LocationItemActions location={location} />
          </div>

          {/* Children Subtree */}
          {hasChildren && !isCollapsed && (
            <ul
              role="group"
              aria-label={`${location.name} sub-locations`}
              className="border-border/60 ml-3.5 border-l pl-2 sm:ml-4 sm:pl-3"
            >
              {renderNodes(children, level + 1)}
            </ul>
          )}
        </li>
      );
    });

  return (
    <ul role="tree" aria-label="Location hierarchy" className="space-y-0.5 p-2">
      {renderNodes(nodes, 1)}
    </ul>
  );
}
