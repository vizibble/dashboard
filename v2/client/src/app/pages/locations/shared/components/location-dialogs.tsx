import { LocationAddDialog } from '@/app/pages/locations/shared/components/location-add-dialog';
import { LocationDeleteDialog } from '@/app/pages/locations/shared/components/location-delete-dialog';
import { LocationRenameDialog } from '@/app/pages/locations/shared/components/location-rename-dialog';

export function LocationDialogs() {
  return (
    <>
      <LocationAddDialog />
      <LocationRenameDialog />
      <LocationDeleteDialog />
    </>
  );
}
