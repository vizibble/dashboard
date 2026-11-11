import { MagnifyingGlassIcon, PlusIcon, XIcon } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import {
  useCreateMetricDefinition,
  useFetchMetricDefinitions,
} from '@/app/pages/templates/shared/hooks/use-templates-api';
import { DATA_TYPE_LABELS, parameterFromDefinition, toParameterKey } from '@/app/pages/templates/shared/lib/parameters';
import type { MetricDataType, TemplateParameterInput } from '@/app/pages/templates/shared/types';
import { Badge } from '@/app/shared/components/ui/badge';
import { Button } from '@/app/shared/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/app/shared/components/ui/field';
import { Input } from '@/app/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/shared/components/ui/select';
import { Spinner } from '@/app/shared/components/ui/spinner';

type ParameterPickerProps = {
  value: TemplateParameterInput[];
  onChange: (parameters: TemplateParameterInput[]) => void;
  disabled?: boolean;
};

/**
 * Search the parameter catalogue and add parameters to a template.
 * Anything missing from the catalogue can be created as a custom parameter on the spot.
 */
export function ParameterPicker({ value, onChange, disabled }: ParameterPickerProps) {
  const { organisation } = useOrganisationContext();
  const { definitions, isPending } = useFetchMetricDefinitions(organisation.id);
  const [query, setQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const selectedKeys = useMemo(() => new Set(value.map((parameter) => parameter.key)), [value]);
  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    return definitions
      .filter((definition) => !selectedKeys.has(definition.key))
      .filter(
        (definition) =>
          !term ||
          definition.label.toLowerCase().includes(term) ||
          definition.key.includes(term) ||
          definition.category?.toLowerCase().includes(term),
      )
      .slice(0, 8);
  }, [definitions, query, selectedKeys]);

  const add = (parameter: TemplateParameterInput) => {
    onChange([...value, parameter]);
    setQuery('');
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="relative">
          <MagnifyingGlassIcon
            size={15}
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search parameters, e.g. temperature, RPM, pressure…"
            aria-label="Search parameters"
            className="pl-9"
            disabled={disabled}
          />
        </div>

        <div className="max-h-56 overflow-y-auto rounded-md border" role="listbox" aria-label="Available parameters">
          {isPending ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 p-4 text-sm">
              <Spinner /> Loading parameters…
            </div>
          ) : results.length === 0 ? (
            <p className="text-muted-foreground p-4 text-center text-sm">
              {query ? `No parameter matches "${query}".` : 'All available parameters are added.'}
            </p>
          ) : (
            results.map((definition) => (
              <button
                key={definition.id}
                type="button"
                role="option"
                aria-selected={false}
                disabled={disabled}
                onClick={() => add(parameterFromDefinition(definition))}
                className="hover:bg-muted/60 focus-visible:bg-muted/60 flex w-full items-center justify-between gap-3 border-b px-3 py-2 text-left last:border-b-0 focus-visible:outline-none"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {definition.label}
                    {definition.symbol && (
                      <span className="text-muted-foreground font-normal"> · {definition.symbol}</span>
                    )}
                  </span>
                  <span className="text-muted-foreground block font-mono text-xs">{definition.key}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {definition.category && <span className="text-muted-foreground text-xs">{definition.category}</span>}
                  <PlusIcon size={14} className="text-muted-foreground" aria-hidden="true" />
                </span>
              </button>
            ))
          )}
        </div>

        {isCreating ? (
          <CustomParameterForm
            initialLabel={query}
            takenKeys={selectedKeys}
            onCancel={() => setIsCreating(false)}
            onCreated={(parameter) => {
              add(parameter);
              setIsCreating(false);
            }}
          />
        ) : (
          <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => setIsCreating(true)}>
            <PlusIcon /> Create a custom parameter
          </Button>
        )}
      </div>

      <div>
        <p className="text-muted-foreground mb-1.5 text-xs font-medium">
          {value.length === 0 ? 'No parameters added yet' : `${value.length} parameter${value.length === 1 ? '' : 's'}`}
        </p>
        {value.length > 0 && (
          <ul className="divide-y rounded-md border">
            {value.map((parameter) => (
              <li key={parameter.key} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {parameter.label}
                    {parameter.symbol && (
                      <span className="text-muted-foreground font-normal"> · {parameter.symbol}</span>
                    )}
                  </span>
                  <span className="text-muted-foreground block font-mono text-xs">{parameter.key}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <Badge variant="secondary">{DATA_TYPE_LABELS[parameter.data_type]}</Badge>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Remove ${parameter.label}`}
                    disabled={disabled}
                    onClick={() => onChange(value.filter((item) => item.key !== parameter.key))}
                  >
                    <XIcon />
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const DATA_TYPES = Object.keys(DATA_TYPE_LABELS) as MetricDataType[];

function CustomParameterForm({
  initialLabel,
  takenKeys,
  onCancel,
  onCreated,
}: {
  initialLabel: string;
  takenKeys: Set<string>;
  onCancel: () => void;
  onCreated: (parameter: TemplateParameterInput) => void;
}) {
  const { organisation } = useOrganisationContext();
  const { mutateAsync, isCreatingDefinition } = useCreateMetricDefinition(organisation.id);
  const [label, setLabel] = useState(initialLabel);
  const [key, setKey] = useState(toParameterKey(initialLabel));
  const [keyEdited, setKeyEdited] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [dataType, setDataType] = useState<MetricDataType>('number');
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!label.trim() || !/^[a-zA-Z][a-zA-Z0-9_.-]*$/.test(key)) {
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
      setError(cause instanceof Error ? cause.message : 'Unable to create parameter.');
    }
  };

  return (
    <div className="bg-muted/30 space-y-3 rounded-md border p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="custom-parameter-label">Name</FieldLabel>
          <Input
            id="custom-parameter-label"
            value={label}
            placeholder="e.g. Spindle load"
            onChange={(event) => {
              setLabel(event.target.value);
              if (!keyEdited) setKey(toParameterKey(event.target.value));
            }}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="custom-parameter-key">Key the device sends</FieldLabel>
          <Input
            id="custom-parameter-key"
            value={key}
            className="font-mono"
            onChange={(event) => {
              setKeyEdited(true);
              setKey(event.target.value.trim());
            }}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="custom-parameter-type">Value type</FieldLabel>
          <Select value={dataType} onValueChange={(next) => setDataType(next as MetricDataType)}>
            <SelectTrigger id="custom-parameter-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATA_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {DATA_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="custom-parameter-symbol">Unit (optional)</FieldLabel>
          <Input
            id="custom-parameter-symbol"
            value={symbol}
            placeholder="e.g. %, N·m, bar"
            maxLength={40}
            onChange={(event) => setSymbol(event.target.value)}
          />
        </Field>
      </div>
      <FieldError>{error}</FieldError>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isCreatingDefinition}>
          Cancel
        </Button>
        <Button type="button" size="sm" onClick={() => void save()} disabled={isCreatingDefinition}>
          {isCreatingDefinition && <Spinner />}
          Add parameter
        </Button>
      </div>
    </div>
  );
}
