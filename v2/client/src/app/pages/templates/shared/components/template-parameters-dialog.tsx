import { useState } from 'react';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { ParameterPicker } from '@/app/pages/templates/shared/components/parameter-picker';
import { useTemplateActions } from '@/app/pages/templates/shared/hooks/use-template-actions';
import { useFetchTemplate, useReplaceTemplateParameters } from '@/app/pages/templates/shared/hooks/use-templates-api';
import { toParameterInput } from '@/app/pages/templates/shared/lib/parameters';
import type { TemplateParameterInput } from '@/app/pages/templates/shared/types';
import { Button } from '@/app/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/shared/components/ui/dialog';
import { FieldError } from '@/app/shared/components/ui/field';
import { Spinner } from '@/app/shared/components/ui/spinner';
import { toast } from '@/app/shared/hooks/use-toast';

/** ?action=parameters&id=… — add or remove the parameters a template's devices send. */
export function TemplateParametersDialog() {
  const { organisation } = useOrganisationContext();
  const { action, targetId, closeDialog } = useTemplateActions();
  const isOpen = action === 'parameters' && Boolean(targetId);
  const { template } = useFetchTemplate(organisation.id, isOpen ? (targetId ?? undefined) : undefined);
  const { mutateAsync, isSavingParameters } = useReplaceTemplateParameters(organisation.id);

  const [parameters, setParameters] = useState<TemplateParameterInput[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load the template's parameters once it is available for this open dialog (adjusting state during render).
  const loadedKey = isOpen && template ? template.id : null;
  const [syncedKey, setSyncedKey] = useState<string | null>(null);
  if (syncedKey !== loadedKey) {
    setSyncedKey(loadedKey);
    if (template && loadedKey !== null) {
      setParameters(template.parameters.map(toParameterInput));
      setError(null);
    }
  }

  const removedCount = template
    ? template.parameters.filter((existing) => !parameters.some((p) => p.key === existing.key)).length
    : 0;

  const save = async () => {
    if (!template) return;
    try {
      await mutateAsync({ templateId: template.id, parameters });
      closeDialog();
      toast({
        variant: 'success',
        title: 'Parameters saved',
        description:
          template.device_count > 0
            ? `${template.device_count} device${template.device_count === 1 ? '' : 's'} now use the updated parameters.`
            : undefined,
      });
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Unable to save parameters.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSavingParameters && closeDialog()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit parameters</DialogTitle>
          <DialogDescription>
            Changes apply to every device using {template ? `"${template.name}"` : 'this template'}. Data already
            recorded is always kept.
          </DialogDescription>
        </DialogHeader>
        {template ? (
          <ParameterPicker value={parameters} onChange={setParameters} disabled={isSavingParameters} />
        ) : (
          <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
            <Spinner /> Loading…
          </div>
        )}
        {removedCount > 0 && template && template.device_count > 0 && (
          <p className="text-muted-foreground rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs">
            Devices will stop accepting readings for {removedCount} removed parameter{removedCount === 1 ? '' : 's'}.
            Their past readings stay available.
          </p>
        )}
        <FieldError>{error}</FieldError>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={isSavingParameters} onClick={closeDialog}>
            Cancel
          </Button>
          <Button type="button" disabled={isSavingParameters || !template} onClick={() => void save()}>
            {isSavingParameters && <Spinner />}
            Save parameters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
