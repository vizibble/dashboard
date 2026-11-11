import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { ParameterPicker } from '@/app/pages/templates/shared/components/parameter-picker';
import { useTemplateActions } from '@/app/pages/templates/shared/hooks/use-template-actions';
import {
  useCreateTemplate,
  useFetchTemplates,
  useUpdateTemplate,
} from '@/app/pages/templates/shared/hooks/use-templates-api';
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
import { Field, FieldError, FieldLabel } from '@/app/shared/components/ui/field';
import { Input } from '@/app/shared/components/ui/input';
import { Textarea } from '@/app/shared/components/ui/textarea';
import { toast } from '@/app/shared/hooks/use-toast';

const detailsSchema = z.object({
  name: z.string().min(1, 'Give the template a name.').max(160),
  description: z.string().max(2000).optional(),
});

type DetailsFormValues = z.infer<typeof detailsSchema>;

/**
 * ?action=create — two steps: name the template, then choose the parameters its devices send.
 * ?action=edit&id=… — rename / re-describe (parameters have their own dialog).
 */
export function TemplateEditorDialog() {
  const navigate = useNavigate();
  const { organisation } = useOrganisationContext();
  const { action, targetId, closeDialog } = useTemplateActions();
  const { templates } = useFetchTemplates(organisation.id);
  const { mutateAsync: create, isCreating } = useCreateTemplate(organisation.id);
  const { mutateAsync: update, isUpdating } = useUpdateTemplate(organisation.id);

  const template = action === 'edit' && targetId ? templates.find((item) => item.id === targetId) : undefined;
  const isCreate = action === 'create';
  const isOpen = isCreate || Boolean(template);
  const isSaving = isCreating || isUpdating;

  // Step 2 (parameter picker) keeps its own state — it's not a standard form field.
  const [step, setStep] = useState<'details' | 'parameters'>('details');
  const [parameters, setParameters] = useState<TemplateParameterInput[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { name: '', description: '' },
  });

  // Reset the form each time the dialog opens or switches template.
  useEffect(() => {
    if (isOpen) {
      setStep('details');
      setParameters([]);
      reset({
        name: template?.name ?? '',
        description: template?.description ?? '',
      });
    }
  }, [isOpen, template?.id, reset]); // eslint-disable-line react-hooks/exhaustive-deps

  // Store validated details when advancing to step 2.
  const [pendingDetails, setPendingDetails] = useState<DetailsFormValues>({ name: '', description: '' });

  const onDetailsSubmit = async (values: DetailsFormValues) => {
    if (isCreate) {
      setPendingDetails(values);
      setStep('parameters');
      return;
    }
    if (!template) return;
    try {
      await update({
        templateId: template.id,
        values: { name: values.name.trim(), description: values.description?.trim() || null },
      });
      closeDialog();
      toast({ variant: 'success', title: 'Template updated' });
    } catch (cause: unknown) {
      setError('root', { message: cause instanceof Error ? cause.message : 'Unable to save template.' });
    }
  };

  const createTemplate = async () => {
    // Since we're on step 2, the form has already been validated — use pendingDetails stored when advancing.
    try {
      const created = await create({
        name: pendingDetails.name.trim(),
        description: pendingDetails.description?.trim() || null,
        parameters,
      });
      toast({ variant: 'success', title: 'Template created', description: `"${created.name}" is ready for devices.` });
      void navigate(`/templates/${created.id}`);
    } catch (cause: unknown) {
      setStep('details');
      setError('root', { message: cause instanceof Error ? cause.message : 'Unable to create template.' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSaving && closeDialog()}>
      <DialogContent className={step === 'parameters' ? 'max-h-[90vh] overflow-y-auto sm:max-w-xl' : undefined}>
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
            <form onSubmit={(event) => void handleSubmit(onDetailsSubmit)(event)} className="space-y-4" noValidate>
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
                <Textarea id="template-description" maxLength={2000} disabled={isSaving} {...register('description')} />
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
              <DialogTitle>What does a {pendingDetails.name.trim()} send?</DialogTitle>
              <DialogDescription>
                Step 2 of 2 · Add the readings these devices report. You can change them later.
              </DialogDescription>
            </DialogHeader>
            <ParameterPicker value={parameters} onChange={setParameters} disabled={isCreating} />
            <FieldError>{errors.root?.message}</FieldError>
            <DialogFooter>
              <Button type="button" variant="outline" disabled={isCreating} onClick={() => setStep('details')}>
                Back
              </Button>
              <Button type="button" loading={isCreating} loadingText="Creating…" onClick={() => void createTemplate()}>
                Create template
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
