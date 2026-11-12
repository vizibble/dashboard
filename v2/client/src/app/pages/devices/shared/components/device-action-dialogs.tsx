import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { DeviceKeyPanel } from '@/app/pages/devices/shared/components/device-key-panel';
import { useDeviceActions } from '@/app/pages/devices/shared/hooks/use-device-actions';
import { useDeleteDevice, useRotateDeviceKey } from '@/app/pages/devices/shared/hooks/use-device-mutations';
import { useFetchDevices } from '@/app/pages/devices/shared/hooks/use-device-queries';
import { ConfirmDialog } from '@/app/shared/components/confirm-dialog';
import { Dialog, DialogContent } from '@/app/shared/components/ui/dialog';
import { toast } from '@/app/shared/hooks/use-toast';
import { getErrorMessage } from '@/app/shared/utils/error-message';

/** ?action=delete&id=… */
export function DeviceDeleteDialog() {
  const navigate = useNavigate();

  const { deviceId: activeDeviceId } = useParams();

  const { organisation } = useOrganisationContext();

  const { action, targetId, closeDialog } = useDeviceActions();

  const { data: devices = [] } = useFetchDevices(organisation.id);

  const { mutateAsync, isPending: isDeleting } = useDeleteDevice(organisation.id);

  const device = action === 'delete' && targetId ? devices.find((item) => item.id === targetId) : undefined;

  const handleDelete = async () => {
    if (!device) {
      return;
    }
    try {
      await mutateAsync(device.id);
      closeDialog();
      toast({
        variant: 'success',
        title: 'Device deleted',
        description: `"${device.name}" has been deleted.`,
      });
      if (activeDeviceId === device.id) {
        void navigate('/devices', { replace: true });
      }
    } catch (cause: unknown) {
      toast({
        variant: 'destructive',
        title: 'Unable to delete device',
        description: getErrorMessage(cause),
      });
    }
  };

  return (
    <ConfirmDialog
      open={Boolean(device)}
      onClose={closeDialog}
      onConfirm={() => void handleDelete()}
      title="Delete device?"
      description={`"${device?.name}" will be removed and its key will stop working. This cannot be undone.`}
      confirmLabel="Delete device"
      destructive
      isPending={isDeleting}
    />
  );
}

/** ?action=rotate-key&id=… — confirm, then show the new key once. */
export function DeviceRotateKeyDialog() {
  const { organisation } = useOrganisationContext();

  const { action, targetId, closeDialog } = useDeviceActions();

  const { data: devices = [] } = useFetchDevices(organisation.id);

  const { mutateAsync, isPending: isRotating } = useRotateDeviceKey(organisation.id);

  const [rotated, setRotated] = useState<{
    deviceId: string;
    key: string;
  } | null>(null);

  const device =
    action === 'rotate-key' && targetId ? devices.find((item) => item.id === targetId) : undefined;

  // A key is only shown for the device it was generated for.
  const newKey = rotated && rotated.deviceId === device?.id ? rotated.key : null;

  const handleRotate = async () => {
    if (!device) {
      return;
    }
    try {
      const result = await mutateAsync(device.id);

      setRotated({ deviceId: device.id, key: result.device_key });
    } catch (cause: unknown) {
      toast({
        variant: 'destructive',
        title: 'Unable to rotate key',
        description: getErrorMessage(cause),
      });
    }
  };

  if (newKey) {
    return (
      <Dialog open={Boolean(device)} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DeviceKeyPanel deviceKey={newKey} onDone={closeDialog} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <ConfirmDialog
      open={Boolean(device)}
      onClose={closeDialog}
      onConfirm={() => void handleRotate()}
      title="Rotate device key?"
      description={`A new key is issued for "${device?.name}". The current key stops working immediately, so update the device right after.`}
      confirmLabel="Rotate key"
      isPending={isRotating}
    />
  );
}
