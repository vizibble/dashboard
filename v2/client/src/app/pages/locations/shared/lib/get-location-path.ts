import type { Location } from '@/app/pages/locations/shared/types';

export function getLocationPath(location: Location, locationsById: Map<string, Location>) {
  const path: Location[] = [];
  const visited = new Set<string>();
  let current: Location | undefined = location;

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    path.unshift(current);
    current = current.parent_id ? locationsById.get(current.parent_id) : undefined;
  }

  return path;
}
