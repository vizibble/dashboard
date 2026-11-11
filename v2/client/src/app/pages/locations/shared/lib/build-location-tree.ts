import type { Location } from '@/app/pages/locations/shared/types';

export type LocationTreeNode = {
  location: Location;
  children: LocationTreeNode[];
};

export function buildLocationTree(locations: Location[]): LocationTreeNode[] {
  const locationsById = new Map(locations.map((location) => [location.id, location]));
  const childrenByParentId = new Map<string, Location[]>();
  const roots: Location[] = [];

  for (const location of locations) {
    const parentId = location.parent_id;
    if (!parentId || parentId === location.id || !locationsById.has(parentId)) {
      roots.push(location);
      continue;
    }
    const siblings = childrenByParentId.get(parentId) ?? [];
    siblings.push(location);
    childrenByParentId.set(parentId, siblings);
  }

  const visited = new Set<string>();
  function createNode(location: Location): LocationTreeNode | null {
    if (visited.has(location.id)) {
      return null;
    }
    visited.add(location.id);
    const children = (childrenByParentId.get(location.id) ?? [])
      .map(createNode)
      .filter((node): node is LocationTreeNode => node !== null);
    return { location, children };
  }

  const tree = roots.map(createNode).filter((node): node is LocationTreeNode => node !== null);
  // Keep orphaned or cyclic records visible instead of silently hiding them.
  for (const location of locations) {
    const node = createNode(location);
    if (node) {
      tree.push(node);
    }
  }

  return tree;
}
