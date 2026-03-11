import { useState } from 'react';

import { Settings, X } from 'lucide-react';

import { DeviceTabs } from '@/components/device-tabs';
import { AddRuleForm } from '@/pages/alerts/components/add-rule-form';
import { RulesList } from '@/pages/alerts/components/rules-list';
import { useFetchDeviceParams } from '@/pages/alerts/hooks/fetch-device-params';
import * as Dialog from '@radix-ui/react-dialog';

export function AlertRulesPanel() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const { params: availableParams, loading: loadingParams } =
    useFetchDeviceParams(selectedDeviceId);

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <Settings className="w-4 h-4 cursor-pointer" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          aria-describedby={undefined}
          onInteractOutside={(e) => e.preventDefault()}
          className="fixed left-[50%] top-[50%] z-50 w-[calc(100vw-2rem)] md:w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] bg-white rounded-xl shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] flex flex-col max-h-[85vh] sm:max-h-[90vh]"
        >
          <div className="flex items-center justify-between p-4 sm:px-6 sm:py-4 border-b border-slate-100 shrink-0">
            <Dialog.Title className="sm:text-xl font-semibold text-slate-900">
              Rules
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-slate-400 hover:text-slate-600 rounded-full p-1 sm:p-2 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200">
                <X className="size-3 sm:size-5" />
                <span className="sr-only">Close</span>
              </button>
            </Dialog.Close>
          </div>
          <div className="p-4 sm:p-6 overflow-y-auto min-h-[300px] sm:min-h-[400px]">
            {/* Device selector */}
            <div className="mb-6 overflow-hidden">
              <DeviceTabs
                selectedDevice={selectedDeviceId}
                onSelectDevice={(id) => setSelectedDeviceId(id)}
              />
            </div>

            {selectedDeviceId ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Rules List / Table */}
                <RulesList selectedDevice={selectedDeviceId} />

                {/* Add rule form */}
                <AddRuleForm
                  selectedDeviceId={selectedDeviceId}
                  availableParams={availableParams}
                  loadingParams={loadingParams}
                />
              </div>
            ) : undefined}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
