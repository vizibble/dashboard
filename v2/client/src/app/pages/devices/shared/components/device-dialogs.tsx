import {
  DeviceDeleteDialog,
  DeviceRotateKeyDialog,
} from '@/app/pages/devices/shared/components/device-action-dialogs';
import { DeviceEditorDialog } from '@/app/pages/devices/shared/components/device-editor-dialog';

export function DeviceDialogs() {
  return (
    <>
      <DeviceEditorDialog />
      <DeviceDeleteDialog />
      <DeviceRotateKeyDialog />
    </>
  );
}
