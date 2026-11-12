import { zodResolver } from '@hookform/resolvers/zod';
import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { useTemplateActions } from '@/app/pages/templates/shared/hooks/use-template-actions';
import {
  useCreateTemplate,
  useUpdateTemplate,
} from '@/app/pages/templates/shared/hooks/use-template-mutations';
import { useFetchTemplates } from '@/app/pages/templates/shared/hooks/use-template-queries';
import type { TemplateParameterInput } from '@/app/pages/templates/shared/types';
import { toast } from '@/app/shared/hooks/use-toast';
import { getErrorMessage } from '@/app/shared/utils/error-message';

const detailsSchema = z.object({
  name: z.string().min(1, 'Give the template a name.').max(160),
  description: z.string().max(2000).optional(),
});

const emptyDetails: DetailsFormValues = {
  name: '',
  description: '',
};

export type DetailsFormValues = z.infer<typeof detailsSchema>;

export type TemplateEditorStep = 'details' | 'parameters';

type EditorSession = {
  key: string;
  step: TemplateEditorStep;
  parameters: TemplateParameterInput[];
  pendingDetails: DetailsFormValues;
};

function toTemplateDetails(values: DetailsFormValues) {
  return {
    name: values.name.trim(),
    description: values.description?.trim() || null,
  };
}

/**
 * Create: two steps — validated details are held while the parameters are picked.
 * Edit: a single details step that saves straight away.
 */
export function useTemplateEditor() {
  const navigate = useNavigate();

  const { organisation } = useOrganisationContext();

  const { action, targetId, closeDialog } = useTemplateActions();

  const { data: templates = [] } = useFetchTemplates(organisation.id);

  const { mutateAsync: create, isPending: isCreating } = useCreateTemplate(organisation.id);

  const { mutateAsync: update, isPending: isUpdating } = useUpdateTemplate(organisation.id);

  const template = action === 'edit' && targetId ? templates.find((item) => item.id === targetId) : undefined;

  const isCreate = action === 'create';

  const isOpen = isCreate || Boolean(template);

  const isSaving = isCreating || isUpdating;

  // Identify each dialog session so its local state resets when opened or switched.
  const sessionKey = isOpen ? `${action}:${template?.id ?? targetId ?? 'new'}` : 'closed';

  const [session, setSession] = useState<EditorSession>(() => ({
    key: sessionKey,
    step: 'details',
    parameters: [],
    pendingDetails: emptyDetails,
  }));

  // Conditional render-time adjustment avoids synchronizing state through an effect.
  if (session.key !== sessionKey) {
    setSession({
      key: sessionKey,
      step: 'details',
      parameters: [],
      pendingDetails: emptyDetails,
    });
  }

  const setStep = useCallback<Dispatch<SetStateAction<TemplateEditorStep>>>((value) => {
    setSession((current) => ({
      ...current,
      step: typeof value === 'function' ? value(current.step) : value,
    }));
  }, []);

  const setParameters = useCallback<Dispatch<SetStateAction<TemplateParameterInput[]>>>((value) => {
    setSession((current) => ({
      ...current,
      parameters: typeof value === 'function' ? value(current.parameters) : value,
    }));
  }, []);

  const formValues = useMemo<DetailsFormValues>(
    () =>
      isOpen
        ? {
            name: template?.name ?? '',
            description: template?.description ?? '',
          }
        : emptyDetails,
    [isOpen, template?.name, template?.description],
  );

  const form = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsSchema),
    values: formValues,
  });

  const { setError } = form;

  const submitDetails = async (values: DetailsFormValues) => {
    if (isCreate) {
      setSession((current) => ({
        ...current,
        pendingDetails: values,
        step: 'parameters',
      }));

      return;
    }

    if (!template) {
      return;
    }

    try {
      await update({
        templateId: template.id,
        values: toTemplateDetails(values),
      });

      closeDialog();
      toast({ variant: 'success', title: 'Template updated' });
    } catch (cause: unknown) {
      setError('root', {
        message: getErrorMessage(cause, 'Unable to save template.'),
      });
    }
  };

  const createTemplate = async () => {
    try {
      const created = await create({
        ...toTemplateDetails(session.pendingDetails),
        parameters: session.parameters,
      });

      toast({
        variant: 'success',
        title: 'Template created',
        description: `"${created.name}" is ready for devices.`,
      });

      void navigate(`/templates/${created.id}`);
    } catch (cause: unknown) {
      setStep('details');

      setError('root', {
        message: getErrorMessage(cause, 'Unable to create template.'),
      });
    }
  };

  return {
    form,
    isOpen,
    isCreate,
    isSaving,
    isCreating,
    step: session.step,
    setStep,
    parameters: session.parameters,
    setParameters,
    pendingName: session.pendingDetails.name.trim(),
    submitDetails,
    createTemplate,
    closeDialog,
  };
}
