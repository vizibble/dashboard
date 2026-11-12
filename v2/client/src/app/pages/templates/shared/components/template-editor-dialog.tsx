import { ParameterPicker } from '@/app/pages/templates/shared/components/parameter-picker';
import { useTemplateEditor } from '@/app/pages/templates/shared/hooks/use-template-editor';
import { Button } from '@/app/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/shared/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/app/shared/components/ui/field';
import { Input } from '@/app/shared/components/ui/input';
import { Textarea } from '@/app/shared/components/ui/textarea';

/**
 * ?action=create — two steps: name the template, then choose the parameters its devices send.
 * ?action=edit&id=… — rename / re-describe (parameters have their own dialog).
 */
export function TemplateEditorDialog() {
  const {
    form: {
      register,
      handleSubmit,
      formState: { errors },
    },
    isOpen,
    isCreate,
    isSaving,
    isCreating,
    step,
    setStep,
    parameters,
    setParameters,
    pendingName,
    submitDetails,
    createTemplate,
    closeDialog,
  } = useTemplateEditor();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSaving && closeDialog()}>
      <DialogContent
        className={step === 'parameters' ? 'max-h-[90vh] overflow-y-auto sm:max-w-xl' : undefined}
      >
        {step === 'details' ? (
          <>
            <DialogHeader>
              <DialogTitle>{isCreate ? 'New template' : 'Edit template'}</DialogTitle>
              <DialogDescription>
                {isCreate
                  ? 'Step 1 of 2 · Name the kind of device this template describes.'
                  : 'Update the template details.'}
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(event) => void handleSubmit(submitDetails)(event)}
              className="space-y-4"
              noValidate
            >
              <Field>
                <FieldLabel htmlFor="template-name" required>
                  Name
                </FieldLabel>
                <Input
                  id="template-name"
                  placeholder="e.g. Knitting machine, Cold room sensor"
                  maxLength={160}
                  disabled={isSaving}
                  aria-invalid={Boolean(errors.name)}
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                  {...register('name')}
                />
                <FieldError>{errors.name?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="template-description">Description (optional)</FieldLabel>
                <Textarea
                  id="template-description"
                  maxLength={2000}
                  disabled={isSaving}
                  {...register('description')}
                />
              </Field>
              <FieldError>{errors.root?.message}</FieldError>
              <DialogFooter>
                <Button type="button" variant="outline" disabled={isSaving} onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" loading={isSaving} loadingText={isCreate ? 'Next…' : 'Saving…'}>
                  {isCreate ? 'Next' : 'Save changes'}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>What does a {pendingName} send?</DialogTitle>
              <DialogDescription>
                Step 2 of 2 · Add the readings these devices report. You can change them later.
              </DialogDescription>
            </DialogHeader>
            <ParameterPicker value={parameters} onChange={setParameters} disabled={isCreating} />
            <FieldError>{errors.root?.message}</FieldError>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isCreating}
                onClick={() => setStep('details')}
              >
                Back
              </Button>
              <Button
                type="button"
                loading={isCreating}
                loadingText="Creating…"
                onClick={() => void createTemplate()}
              >
                Create template
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
