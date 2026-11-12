import { useState } from 'react';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { useCreateMetricDefinition } from '@/app/pages/templates/shared/hooks/use-template-mutations';
import {
  isMetricDataType,
  isValidParameterKey,
  parameterFromDefinition,
  toParameterKey,
} from '@/app/pages/templates/shared/lib/parameters';
import type { MetricDataType, TemplateParameterInput } from '@/app/pages/templates/shared/types';
import { getErrorMessage } from '@/app/shared/utils/error-message';

type CustomParameterFormOptions = {
  initialLabel: string;
  takenKeys: Set<string>;
  onCreated: (parameter: TemplateParameterInput) => void;
};

/** State and save flow for creating a custom catalogue parameter. The key follows the name until edited. */
export function useCustomParameterForm({ initialLabel, takenKeys, onCreated }: CustomParameterFormOptions) {
  const { organisation } = useOrganisationContext();

  const { mutateAsync, isPending } = useCreateMetricDefinition(organisation.id);

  const [label, setLabelState] = useState(initialLabel);

  const [key, setKeyState] = useState(toParameterKey(initialLabel));

  const [keyEdited, setKeyEdited] = useState(false);

  const [symbol, setSymbol] = useState('');

  const [dataType, setDataTypeState] = useState<MetricDataType>('number');

  const [error, setError] = useState<string | null>(null);

  const setLabel = (next: string) => {
    setLabelState(next);
    if (!keyEdited) {
      setKeyState(toParameterKey(next));
    }
  };

  const setKey = (next: string) => {
    setKeyEdited(true);
    setKeyState(next.trim());
  };

  const setDataType = (next: string) => {
    if (isMetricDataType(next)) {
      setDataTypeState(next);
    }
  };

  const save = async () => {
    if (!label.trim() || !isValidParameterKey(key)) {
      setError('Enter a name. The key must start with a letter and use letters, numbers, _ . or -.');

      return;
    }
    if (takenKeys.has(key)) {
      setError(`"${key}" is already in this template.`);

      return;
    }
    try {
      const definition = await mutateAsync({
        key,
        label: label.trim(),
        data_type: dataType,
        symbol: symbol.trim() || null,
        unit: symbol.trim() || null,
      });

      onCreated(parameterFromDefinition(definition));
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Unable to create parameter.'));
    }
  };

  return {
    label,
    setLabel,
    key,
    setKey,
    symbol,
    setSymbol,
    dataType,
    setDataType,
    error,
    isPending,
    save,
  };
}
