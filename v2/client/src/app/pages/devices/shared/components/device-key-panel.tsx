import { Button } from '@/app/shared/components/ui/button';
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/shared/components/ui/dialog';

/** Dialog body that shows a freshly issued device key exactly once. */
export function DeviceKeyPanel({ deviceKey, onDone }: { deviceKey: string; onDone: () => void }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Save this device key</DialogTitle>
        <DialogDescription>
          This key is shown only once. Store it securely; the device needs it to send telemetry.
        </DialogDescription>
      </DialogHeader>
      <div className="bg-muted overflow-x-auto rounded-md p-3 font-mono text-sm break-all select-all">
        {deviceKey}
      </div>
      <DialogFooter>
        <Button onClick={onDone}>I have saved it</Button>
      </DialogFooter>
    </>
  );
}
