import { PencilSimpleIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { LocationChildrenSection } from '@/app/pages/locations/detail/components/location-children-card';
import { LocationDevicesSection } from '@/app/pages/locations/detail/components/location-devices-section';
import { useLocationActions } from '@/app/pages/locations/shared/hooks/use-location-actions';
import { getLocationPath } from '@/app/pages/locations/shared/lib/get-location-path';
import type { Location } from '@/app/pages/locations/shared/types';
import { FormField, FormSection, FormView } from '@/app/shared/components/layout/form-view';
import { Indicator, PageHeader } from '@/app/shared/components/layout/page-header';
import { Button } from '@/app/shared/components/ui/button';

interface LocationDetailsProps {
  location: Location;
  locationsById: Map<string, Location>;
}

export function LocationDetails({ location, locationsById }: LocationDetailsProps) {
  const { openCreate, openRename, openDelete, can } = useLocationActions();

  const directChildren = useMemo(
    () => Array.from(locationsById.values()).filter((item) => item.parent_id === location.id),
    [locationsById, location.id],
  );

  const path = useMemo(() => getLocationPath(location, locationsById), [location, locationsById]);

  const parent = path.length > 1 ? path[path.length - 2] : undefined;

  return (
    <>
      <PageHeader
        back={parent ? { to: `/locations/${parent.id}`, label: parent.name } : { to: '/locations', label: 'Locations' }}
        title={location.name}
        status={
          <Indicator tone={location.can_have_children ? 'blue' : 'green'}>
            {location.can_have_children ? 'Container' : 'Device-ready'}
          </Indicator>
        }
        menu={[
          ...(can.update ? [{ label: 'Rename', icon: PencilSimpleIcon, onSelect: () => openRename(location.id) }] : []),
          ...(can.delete
            ? [{ label: 'Delete', icon: TrashIcon, destructive: true, onSelect: () => openDelete(location.id) }]
            : []),
        ]}
        actions={
          can.create &&
          location.can_have_children && (
            <Button size="sm" onClick={() => openCreate(location.id)}>
              <PlusIcon /> Add sub-location
            </Button>
          )
        }
      />

      <FormView>
        <FormSection title="Details" columns={3}>
          <FormField label="Type">{location.can_have_children ? 'Container space' : 'Terminal space'}</FormField>
          <FormField label="Parent">
            {parent && (
              <Link to={`/locations/${parent.id}`} className="hover:text-primary">
                {parent.name}
              </Link>
            )}
          </FormField>
          <FormField label="Path">{path.map((item) => item.name).join(' / ')}</FormField>
        </FormSection>
      </FormView>

      {location.can_have_children ? (
        <LocationChildrenSection location={location} childrenLocations={directChildren} />
      ) : (
        <LocationDevicesSection locationId={location.id} />
      )}
    </>
  );
}
