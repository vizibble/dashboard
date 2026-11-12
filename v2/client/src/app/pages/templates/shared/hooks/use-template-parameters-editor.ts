import { useState } from 'react';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { useReplaceTemplateParameters } from '@/app/pages/templates/shared/hooks/use-template-mutations';
import { useFetchTemplate } from '@/app/pages/templates/shared/hooks/use-template-queries';
import {
  countRemovedParameters,
  pluralise,
  toParameterInput,
} from '@/app/pages/templates/shared/lib/parameters';
import type { TemplateParameterInput } from '@/app/pages/templates/shared/types';
import { toast } from '@/app/shared/hooks/use-toast';
import { getErrorMessage } from '@/app/shared/utils/error-message';

/** Loads a template's parameters into local state while the dialog is open and saves the edited list. */
export function useTemplateParametersEditor(templateId: string | undefined, onSaved: () => void) {
  const { organisation } = useOrganisationContext();

  const { data: template } = useFetchTemplate(organisation.id, templateId);

  const { mutateAsync, isPending } = useReplaceTemplateParameters(organisation.id);

  const [parameters, setParameters] = useState<TemplateParameterInput[]>([]);

  const [error, setError] = useState<string | null>(null);

  // Load the template's parameters once it is available for this open dialog (adjusting state during render).
  const loadedKey = templateId && template ? template.id : null;

  const [syncedKey, setSyncedKey] = useState<string | null>(null);

  if (syncedKey !== loadedKey) {
    setSyncedKey(loadedKey);
    if (template && loadedKey !== null) {
      setParameters(template.parameters.map(toParameterInput));
      setError(null);
    }
  }

  const removedCount = template ? countRemovedParameters(template.parameters, parameters) : 0;

  const save = async () => {
    if (!template) {
      return;
    }
    try {
      await mutateAsync({ templateId: template.id, parameters });
      onSaved();
      let description: string | undefined;

      if (template.device_count > 0) {
        description = `${pluralise(template.device_count, 'device')} now use the updated parameters.`;
      }
      toast({ variant: 'success', title: 'Parameters saved', description });
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Unable to save parameters.'));
    }
  };

  return {
    template,
    parameters,
    setParameters,
    error,
    removedCount,
    isSaving: isPending,
    save,
  };
}
