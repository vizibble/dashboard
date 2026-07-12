import { useState } from 'react';

import { Settings } from 'lucide-react';

import { DeviceSelect } from '@/components/device-select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AddRuleForm } from '@/pages/alerts/components/add-rule-form';
import { RulesList } from '@/pages/alerts/components/rules-list';
import { useFetchDeviceParams } from '@/pages/alerts/hooks/fetch-device-params';

export function AlertRulesPanel() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const { params: availableParams, loading: loadingParams } =
    useFetchDeviceParams(selectedDeviceId);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="size-8" variant="ghost" size="icon">
          <Settings className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] sm:w-[80vw] max-w-none flex flex-col max-h-[85vh] sm:max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-xl font-semibold">Rules</DialogTitle>
        </DialogHeader>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* Device selector */}
          <div className="mb-6">
            <DeviceSelect
              className="w-full sm:max-w-xs"
              onSelectDevice={(id) => setSelectedDeviceId(id)}
              selectedDevice={selectedDeviceId}
            />
          </div>

          {selectedDeviceId ? (
            <div className="bg-white rounded-xl border shadow-sm flex flex-col">
              {/* Rules List / Table */}
              <div className="w-full">
                <RulesList selectedDevice={selectedDeviceId} />
              </div>

              {/* Add rule form */}
              <AddRuleForm
                selectedDeviceId={selectedDeviceId}
                availableParams={availableParams}
                loadingParams={loadingParams}
              />
            </div>
          ) : undefined}
        </div>
      </DialogContent>
    </Dialog>
  );
}
