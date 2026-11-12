import { ParameterPicker } from '@/app/pages/templates/shared/components/parameter-picker';
import { useTemplateActions } from '@/app/pages/templates/shared/hooks/use-template-actions';
import { useTemplateParametersEditor } from '@/app/pages/templates/shared/hooks/use-template-parameters-editor';
import { pluralise } from '@/app/pages/templates/shared/lib/parameters';
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

/** ?action=parameters&id=… — add or remove the parameters a template's devices send. */
export function TemplateParametersDialog() {
  const { action, targetId, closeDialog } = useTemplateActions();

  const isOpen = action === 'parameters' && Boolean(targetId);

  const openTemplateId = isOpen ? (targetId ?? undefined) : undefined;

  const { template, parameters, setParameters, error, removedCount, isSaving, save } =
    useTemplateParametersEditor(openTemplateId, closeDialog);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSaving && closeDialog()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit parameters</DialogTitle>
          <DialogDescription>
            Changes apply to every device using {template ? `"${template.name}"` : 'this template'}. Data
            already recorded is always kept.
          </DialogDescription>
        </DialogHeader>
        {template ? (
          <ParameterPicker value={parameters} onChange={setParameters} disabled={isSaving} />
        ) : (
          <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
            <Spinner /> Loading…
          </div>
        )}
        {removedCount > 0 && template && template.device_count > 0 && (
          <p className="text-muted-foreground rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs">
            Devices will stop accepting readings for {pluralise(removedCount, 'removed parameter')}. Their
            past readings stay available.
          </p>
        )}
        <FieldError>{error}</FieldError>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={isSaving} onClick={closeDialog}>
            Cancel
          </Button>
          <Button type="button" disabled={isSaving || !template} onClick={() => void save()}>
            {isSaving && <Spinner />}
            Save parameters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
